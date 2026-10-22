package com.obdai.diagnostic.service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.domain.ScanReport;
import com.obdai.diagnostic.domain.Vehicle;
import com.obdai.diagnostic.repo.ScanReportRepository;
import com.obdai.diagnostic.repo.VehicleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class ScanService {
    private final DtcParser parser;private final DiagnosticResolutionService resolver;private final VinDecoderService vinDecoder;
    private final AiDiagnosticService ai;private final ScanReportRepository reports;private final VehicleRepository vehicles;
    private final SubscriptionService subscription;private final ObjectMapper mapper;private final AuditService audit;private final NotificationService notifications;private final LocalFileStorageService storage;
    public ScanService(DtcParser parser,DiagnosticResolutionService resolver,VinDecoderService vinDecoder,AiDiagnosticService ai,
                       ScanReportRepository reports,VehicleRepository vehicles,SubscriptionService subscription,ObjectMapper mapper,AuditService audit,NotificationService notifications,LocalFileStorageService storage){
        this.parser=parser;this.resolver=resolver;this.vinDecoder=vinDecoder;this.ai=ai;this.reports=reports;this.vehicles=vehicles;
        this.subscription=subscription;this.mapper=mapper;this.audit=audit;this.notifications=notifications;this.storage=storage;
    }
    @Transactional
    public ApiModels.ScanReportDto upload(String ownerId,MultipartFile file){
        subscription.assertScanAllowed(ownerId);
        DtcParser.ParsedScan parsed=parser.parse(file);
        List<ApiModels.DiagnosticFinding> findings=parsed.codes().stream().map(resolver::resolve).toList();
        Vehicle vehicle=parsed.vin()==null?null:resolveVehicle(ownerId,parsed.vin(),parsed.mileage());
        String summary=summary(findings);
        String aiText=ai.explain(findings);
        ScanReport report=new ScanReport();report.setOwnerId(ownerId);report.setVehicleId(vehicle==null?null:vehicle.getId());
        report.setOriginalFileName(cleanFileName(file.getOriginalFilename()));report.setSourceFormat(parsed.format());
        report.setDiagnosticsJson(writeJson(findings));report.setSummary(summary);report.setAiAnalysis(aiText);
        report.setStorageKey(storage.store(file));
        report.setHealthScore(healthScore(findings));report.setUploadedBytes(file.getSize());reports.save(report);
        audit.record(ownerId,"SCAN_UPLOADED","REPORT",report.getId());
        notifications.create(ownerId,"SCAN","Diagnostic report ready",
            findings.size()+" diagnostic code"+(findings.size()==1?" was":"s were")+" extracted from "+report.getOriginalFileName()+".");
        return dto(report,vehicle,findings);
    }
    @Transactional(readOnly=true)
    public List<ApiModels.ScanReportDto> list(String ownerId,int limit){
        var rows=reports.findAllByOwnerIdOrderByCreatedAtDesc(ownerId,PageRequest.of(0,Math.max(1,Math.min(limit,100))));
        return rows.stream().map(r->dto(r,vehicleFor(r),readFindings(r))).toList();
    }
    @Transactional(readOnly=true)
    public ApiModels.ScanReportDto get(String ownerId,String id){
        ScanReport r=owned(ownerId,id);return dto(r,vehicleFor(r),readFindings(r));
    }
    @Transactional
    public void delete(String ownerId,String id){
        ScanReport row=owned(ownerId,id);reports.delete(row);storage.delete(row.getStorageKey());audit.record(ownerId,"REPORT_DELETED","REPORT",id);
    }
    @Transactional(readOnly=true)
    public LocalFileStorageService.StoredFile downloadSource(String ownerId,String id){
        ScanReport row=owned(ownerId,id);return new LocalFileStorageService.StoredFile(row.getOriginalFileName(),storage.read(row.getStorageKey()));
    }
    @Transactional(readOnly=true)
    public List<ApiModels.ScanReportDto> latest(String ownerId,int limit){return list(ownerId,limit);}
    private Vehicle resolveVehicle(String ownerId,String vin,Long mileage){
        Vehicle existing=vehicles.findByOwnerIdAndVin(ownerId,vin).orElse(null);
        ApiModels.VinDecode decoded=null;
        try{decoded=vinDecoder.decode(vin);}catch(ApiException ignored){}
        if(existing==null){
            existing=new Vehicle();existing.setOwnerId(ownerId);existing.setVin(vin);existing.setNickname(null);
            if(decoded!=null){existing.setMake(blankNull(decoded.make()));existing.setModel(blankNull(decoded.model()));existing.setYear(decoded.year());
                existing.setEngine(blankNull(decoded.engine()));existing.setTransmission(blankNull(decoded.transmission()));existing.setFuelType(blankNull(decoded.fuelType()));
                existing.setRegion(blankNull(decoded.region()));existing.setDisplacementL(decoded.displacementL());}
        }
        if(mileage!=null&&(existing.getMileage()==null||mileage>existing.getMileage()))existing.setMileage(mileage);
        return vehicles.save(existing);
    }
    private String summary(List<ApiModels.DiagnosticFinding> findings){
        if(findings.isEmpty())return "No valid diagnostic trouble codes were detected in the uploaded file. Vehicle metadata may still be available.";
        long verified=findings.stream().filter(f->!"UNKNOWN".equals(f.severity())).count();
        if(verified==0)return findings.size()+" diagnostic code"+(findings.size()==1?" was":"s were")+" extracted. No configured provider returned verified descriptions, so severity and repair advice are unavailable.";
        String titles=findings.stream().filter(f->!"UNKNOWN".equals(f.severity())).limit(3).map(f->f.code()+" "+f.title()).reduce((a,b)->a+"; "+b).orElse("");
        long unknown=findings.size()-verified;
        return findings.size()+" diagnostic code"+(findings.size()==1?" was":"s were")+" extracted. Verified provider details are available for "+verified+" code"+(verified==1?"":"s")+": "+titles+"."+(unknown>0?" "+unknown+" code"+(unknown==1?" remains":"s remain")+" unresolved.":"");
    }
    private Integer healthScore(List<ApiModels.DiagnosticFinding> findings){
        if(findings.isEmpty()||findings.stream().noneMatch(f->List.of("INFO","LOW","MEDIUM","HIGH","CRITICAL").contains(f.severity())))return null;
        int score=100;
        for(var f:findings)score-=switch(f.severity()){case "LOW"->5;case "MEDIUM"->15;case "HIGH"->30;case "CRITICAL"->45;default->0;};
        return Math.max(0,score);
    }
    private ScanReport owned(String ownerId,String id){return reports.findByIdAndOwnerId(id,ownerId).orElseThrow(()->ApiException.notFound("Report not found."));}
    private Vehicle vehicleFor(ScanReport r){return r.getVehicleId()==null?null:vehicles.findByIdAndOwnerId(r.getVehicleId(),r.getOwnerId()).orElse(null);}
    private ApiModels.ScanReportDto dto(ScanReport r,Vehicle v,List<ApiModels.DiagnosticFinding> findings){
        String vehicleName=v==null?null:(v.getNickname()!=null?v.getNickname():String.join(" ",Arrays.asList(v.getYear()==null?"":String.valueOf(v.getYear()),nullToEmpty(v.getMake()),nullToEmpty(v.getModel())).stream().filter(s->!s.isBlank()).toList()));
        return new ApiModels.ScanReportDto(r.getId(),r.getOriginalFileName(),r.getSourceFormat(),r.getVehicleId(),vehicleName,
            findings,r.getSummary(),r.getAiAnalysis(),r.getHealthScore(),r.getUploadedBytes(),r.getCreatedAt());
    }
    private List<ApiModels.DiagnosticFinding> readFindings(ScanReport r){try{return mapper.readValue(r.getDiagnosticsJson(),new TypeReference<>(){});}catch(Exception e){return List.of();}}
    private String writeJson(Object value){try{return mapper.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException("Report data serialization failed",e);}}
    private String cleanFileName(String name){String value=name==null?"scanner-export.txt":name.replaceAll("[\\\\/\\p{Cntrl}]","_").trim();if(value.isBlank())value="scanner-export.txt";return value.substring(0,Math.min(value.length(),255));}
    private String blankNull(String value){return value==null||value.isBlank()?null:value;}
    private String nullToEmpty(String value){return value==null?"":value;}
}
