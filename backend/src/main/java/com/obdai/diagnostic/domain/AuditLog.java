package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="audit_logs",indexes=@Index(name="idx_audit_actor_created",columnList="actor_id,created_at"))
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="actor_id",length=36) private String actorId;
    @Column(nullable=false,length=80) private String action;
    @Column(name="resource_type",nullable=false,length=60) private String resourceType;
    @Column(name="resource_id",length=64) private String resourceId;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public AuditLog() {}
    public AuditLog(String actor,String action,String type,String resource){this.actorId=actor;this.action=action;this.resourceType=type;this.resourceId=resource;}
}
