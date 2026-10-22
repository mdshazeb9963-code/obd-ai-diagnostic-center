package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.domain.Vehicle;
import com.obdai.diagnostic.repo.ScanReportRepository;
import com.obdai.diagnostic.repo.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Locale;
@Service
public class VehicleService {
    private final VehicleRepository vehicles;private final ScanReportRepository reports;private final VinDecoderService decoder;private final AuditService audit;
    public VehicleService(VehicleRepository vehicles,ScanReportRepository reports,VinDecoderService decoder,AuditService audit){this.vehicles=vehicles;this.reports=reports;this.decoder=decoder;this.audit=audit;}
    @Transactional(readOnly=true)
    public List<ApiModels.VehicleDto> list(String owner){return vehicles.findAllByOwnerIdOrderByCreatedAtDesc(owner).stream().map(this::dto).toList();}
    @Transactional
    public ApiModels.VehicleDto create(String owner,ApiModels.VehicleRequest request){
        String vin=normalizeVin(request.vin());
        if(vin!=null&&vehicles.existsByOwnerIdAndVin(owner,vin))throw ApiException.conflict("This VIN is already in your garage.");
        ApiModels.VinDecode decoded=null;
        if(vin!=null&&(empty(request.make())||empty(request.model())||request.year()==null)){
            try{decoded=decoder.decode(vin);}catch(ApiException ignored){}
        }
        Vehicle v=new Vehicle();v.setOwnerId(owner);v.setVin(vin);apply(v,request,decoded);vehicles.save(v);
        audit.record(owner,"VEHICLE_CREATED","VEHICLE",v.getId());return dto(v);
    }
    @Transactional
    public ApiModels.VehicleDto update(String owner,String id,ApiModels.VehicleRequest request){
        Vehicle v=owned(owner,id);String vin=normalizeVin(request.vin());
        if(vin!=null&&!vin.equals(v.getVin())&&vehicles.existsByOwnerIdAndVin(owner,vin))throw ApiException.conflict("This VIN is already in your garage.");
        ApiModels.VinDecode decoded=null;
        if(vin!=null&&(empty(request.make())||empty(request.model())||request.year()==null))try{decoded=decoder.decode(vin);}catch(ApiException ignored){}
        v.setVin(vin);apply(v,request,decoded);audit.record(owner,"VEHICLE_UPDATED","VEHICLE",id);return dto(v);
    }
    @Transactional
    public void delete(String owner,String id){Vehicle v=owned(owner,id);vehicles.delete(v);audit.record(owner,"VEHICLE_DELETED","VEHICLE",id);}
    private void apply(Vehicle v,ApiModels.VehicleRequest r,ApiModels.VinDecode d){
        v.setNickname(clean(r.nickname()));v.setMake(first(r.make(),d==null?null:d.make()));v.setModel(first(r.model(),d==null?null:d.model()));
        v.setYear(r.year()!=null?r.year():d==null?null:d.year());v.setEngine(first(r.engine(),d==null?null:d.engine()));
        v.setTransmission(first(r.transmission(),d==null?null:d.transmission()));v.setFuelType(first(r.fuelType(),d==null?null:d.fuelType()));
        v.setRegion(first(r.region(),d==null?null:d.region()));v.setDisplacementL(r.displacementL()!=null?r.displacementL():d==null?null:d.displacementL());v.setMileage(r.mileage());
    }
    private ApiModels.VehicleDto dto(Vehicle v){return new ApiModels.VehicleDto(v.getId(),v.getVin(),v.getNickname(),v.getMake(),v.getModel(),v.getYear(),v.getEngine(),v.getTransmission(),v.getFuelType(),v.getRegion(),v.getDisplacementL(),v.getMileage(),v.getCreatedAt(),reports.countByVehicleId(v.getId()));}
    private Vehicle owned(String owner,String id){return vehicles.findByIdAndOwnerId(id,owner).orElseThrow(()->ApiException.notFound("Vehicle not found."));}
    private String normalizeVin(String vin){
        if(vin==null||vin.isBlank())return null;String value=vin.trim().toUpperCase(Locale.ROOT);
        if(!value.matches("[A-HJ-NPR-Z0-9]{17}"))throw ApiException.badRequest("VIN must be 17 characters and cannot contain I, O or Q.");
        return value;
    }
    private String first(String value,String fallback){return empty(value)?fallback:value.trim();}
    private boolean empty(String value){return value==null||value.isBlank();}
    private String clean(String value){return empty(value)?null:value.trim();}
}
