package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.domain.MaintenanceRecord;
import com.obdai.diagnostic.repo.MaintenanceRecordRepository;
import com.obdai.diagnostic.repo.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
@Service
public class MaintenanceService {
    private final VehicleRepository vehicles;private final MaintenanceRecordRepository records;private final AuditService audit;
    public MaintenanceService(VehicleRepository vehicles,MaintenanceRecordRepository records,AuditService audit){this.vehicles=vehicles;this.records=records;this.audit=audit;}
    @Transactional(readOnly=true)
    public List<ApiModels.MaintenanceDto> list(String owner,String vehicle){ownedVehicle(owner,vehicle);return records.findAllByVehicleIdAndOwnerIdOrderByPerformedAtDesc(vehicle,owner).stream().map(this::dto).toList();}
    @Transactional
    public ApiModels.MaintenanceDto create(String owner,String vehicle,ApiModels.MaintenanceRequest request){
        var v=ownedVehicle(owner,vehicle);MaintenanceRecord r=new MaintenanceRecord();r.setOwnerId(owner);r.setVehicleId(v.getId());
        r.setTitle(request.title().trim());r.setNotes(request.notes());r.setPerformedAt(request.performedAt()==null?Instant.now():request.performedAt());
        r.setCost(request.cost());r.setMileage(request.mileage());records.save(r);
        if(request.mileage()!=null&&(v.getMileage()==null||request.mileage()>v.getMileage()))v.setMileage(request.mileage());
        audit.record(owner,"MAINTENANCE_RECORDED","VEHICLE",vehicle);return dto(r);
    }
    @Transactional
    public void delete(String owner,String id){MaintenanceRecord r=records.findByIdAndOwnerId(id,owner).orElseThrow(()->ApiException.notFound("Maintenance record not found."));records.delete(r);}
    private com.obdai.diagnostic.domain.Vehicle ownedVehicle(String owner,String id){return vehicles.findByIdAndOwnerId(id,owner).orElseThrow(()->ApiException.notFound("Vehicle not found."));}
    private ApiModels.MaintenanceDto dto(MaintenanceRecord r){return new ApiModels.MaintenanceDto(r.getId(),r.getVehicleId(),r.getTitle(),r.getNotes(),r.getPerformedAt(),r.getCost(),r.getMileage(),r.getCreatedAt());}
}
