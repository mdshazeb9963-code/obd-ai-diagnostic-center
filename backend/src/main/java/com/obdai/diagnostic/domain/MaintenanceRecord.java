package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="maintenance_records",indexes=@Index(name="idx_maintenance_vehicle",columnList="vehicle_id,performed_at"))
public class MaintenanceRecord {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="vehicle_id",nullable=false,length=36) private String vehicleId;
    @Column(name="owner_id",nullable=false,length=36) private String ownerId;
    @Column(nullable=false,length=140) private String title;
    @Column(length=1000) private String notes;
    @Column(name="performed_at") private Instant performedAt;
    @Column(precision=10,scale=2) private BigDecimal cost;
    private Long mileage;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public MaintenanceRecord() {}
    public String getId(){return id;} public String getVehicleId(){return vehicleId;} public void setVehicleId(String v){vehicleId=v;}
    public String getOwnerId(){return ownerId;} public void setOwnerId(String v){ownerId=v;} public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getNotes(){return notes;} public void setNotes(String v){notes=v;} public Instant getPerformedAt(){return performedAt;} public void setPerformedAt(Instant v){performedAt=v;}
    public BigDecimal getCost(){return cost;} public void setCost(BigDecimal v){cost=v;} public Long getMileage(){return mileage;} public void setMileage(Long v){mileage=v;}
    public Instant getCreatedAt(){return createdAt;}
}
