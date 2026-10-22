package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="cached_diagnostics")
public class CachedDiagnostic {
    @Id @Column(length=5) private String code;
    @Lob @Column(name="payload_json",nullable=false) private String payloadJson;
    @Column(nullable=false,length=255) private String source;
    @Column(name="cached_at",nullable=false) private Instant cachedAt=Instant.now();
    @Column(name="expires_at",nullable=false) private Instant expiresAt;
    public CachedDiagnostic() {}
    public CachedDiagnostic(String code,String payload,String source,Instant expiresAt){this.code=code;this.payloadJson=payload;this.source=source;this.expiresAt=expiresAt;}
    public String getCode(){return code;} public String getPayloadJson(){return payloadJson;} public String getSource(){return source;}
    public Instant getExpiresAt(){return expiresAt;}
}
