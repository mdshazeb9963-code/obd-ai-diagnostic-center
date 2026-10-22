package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface VehicleRepository extends JpaRepository<Vehicle,String> {
    List<Vehicle> findAllByOwnerIdOrderByCreatedAtDesc(String ownerId);
    Optional<Vehicle> findByIdAndOwnerId(String id,String ownerId);
    Optional<Vehicle> findByOwnerIdAndVin(String ownerId,String vin);
    boolean existsByOwnerIdAndVin(String ownerId,String vin);
}
