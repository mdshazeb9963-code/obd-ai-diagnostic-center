package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="vehicles",indexes=@Index(name="idx_vehicle_owner",columnList="owner_id,created_at"))
public class Vehicle {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="owner_id",nullable=false,length=36) private String ownerId;
    @Column(length=17) private String vin;
    @Column(length=100) private String nickname;
    @Column(length=80) private String make;
    @Column(length=100) private String model;
    @Column(name="model_year") private Integer year;
    @Column(length=120) private String engine;
    @Column(length=80) private String transmission;
    @Column(name="fuel_type",length=60) private String fuelType;
    @Column(length=80) private String region;
    @Column(name="displacement_l",precision=4,scale=1) private BigDecimal displacementL;
    private Long mileage;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
    @PreUpdate void updateTime(){updatedAt=Instant.now();}
    public Vehicle() {}
    public String getId(){return id;} public String getOwnerId(){return ownerId;} public void setOwnerId(String v){ownerId=v;}
    public String getVin(){return vin;} public void setVin(String v){vin=v;} public String getNickname(){return nickname;} public void setNickname(String v){nickname=v;}
    public String getMake(){return make;} public void setMake(String v){make=v;} public String getModel(){return model;} public void setModel(String v){model=v;}
    public Integer getYear(){return year;} public void setYear(Integer v){year=v;} public String getEngine(){return engine;} public void setEngine(String v){engine=v;}
    public String getTransmission(){return transmission;} public void setTransmission(String v){transmission=v;}
    public String getFuelType(){return fuelType;} public void setFuelType(String v){fuelType=v;} public String getRegion(){return region;} public void setRegion(String v){region=v;}
    public BigDecimal getDisplacementL(){return displacementL;} public void setDisplacementL(BigDecimal v){displacementL=v;}
    public Long getMileage(){return mileage;} public void setMileage(Long v){mileage=v;} public Instant getCreatedAt(){return createdAt;}
}
