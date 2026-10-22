package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord,String>{
    List<MaintenanceRecord> findAllByVehicleIdAndOwnerIdOrderByPerformedAtDesc(String vehicleId,String ownerId);
    Optional<MaintenanceRecord> findByIdAndOwnerId(String id,String ownerId);
}
