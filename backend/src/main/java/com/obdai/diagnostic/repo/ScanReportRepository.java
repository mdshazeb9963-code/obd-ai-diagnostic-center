package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.ScanReport;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
public interface ScanReportRepository extends JpaRepository<ScanReport,String> {
    List<ScanReport> findAllByOwnerIdOrderByCreatedAtDesc(String ownerId);
    List<ScanReport> findAllByOwnerIdOrderByCreatedAtDesc(String ownerId,Pageable pageable);
    Optional<ScanReport> findByIdAndOwnerId(String id,String ownerId);
    long countByOwnerIdAndCreatedAtGreaterThanEqual(String ownerId,Instant start);
    long countByVehicleId(String vehicleId);
    List<ScanReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
