package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="scan_reports",indexes=@Index(name="idx_report_owner_created",columnList="owner_id,created_at"))
public class ScanReport {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="owner_id",nullable=false,length=36) private String ownerId;
    @Column(name="vehicle_id",length=36) private String vehicleId;
    @Column(name="original_file_name",nullable=false,length=255) private String originalFileName;
    @Column(name="source_format",nullable=false,length=20) private String sourceFormat;
    @Column(name="storage_key",length=160) private String storageKey;
    @Lob @Column(name="diagnostics_json",nullable=false) private String diagnosticsJson="[]";
    @Column(columnDefinition="text") private String summary;
    @Column(name="ai_analysis",columnDefinition="text") private String aiAnalysis;
    @Column(name="health_score") private Integer healthScore;
    @Column(name="uploaded_bytes",nullable=false) private long uploadedBytes;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public ScanReport() {}
    public String getId(){return id;} public String getOwnerId(){return ownerId;} public void setOwnerId(String v){ownerId=v;}
    public String getVehicleId(){return vehicleId;} public void setVehicleId(String v){vehicleId=v;}
    public String getOriginalFileName(){return originalFileName;} public void setOriginalFileName(String v){originalFileName=v;}
    public String getSourceFormat(){return sourceFormat;} public void setSourceFormat(String v){sourceFormat=v;}
    public String getStorageKey(){return storageKey;} public void setStorageKey(String v){storageKey=v;}
    public String getDiagnosticsJson(){return diagnosticsJson;} public void setDiagnosticsJson(String v){diagnosticsJson=v;}
    public String getSummary(){return summary;} public void setSummary(String v){summary=v;}
    public String getAiAnalysis(){return aiAnalysis;} public void setAiAnalysis(String v){aiAnalysis=v;}
    public Integer getHealthScore(){return healthScore;} public void setHealthScore(Integer v){healthScore=v;}
    public long getUploadedBytes(){return uploadedBytes;} public void setUploadedBytes(long v){uploadedBytes=v;}
    public Instant getCreatedAt(){return createdAt;}
}
