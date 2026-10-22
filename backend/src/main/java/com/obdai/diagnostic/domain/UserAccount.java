package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="users")
public class UserAccount {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(nullable=false,unique=true,length=254) private String email;
    @Column(name="display_name",nullable=false,length=120) private String displayName;
    @Column(name="password_hash",nullable=false,length=100) private String passwordHash;
    @Column(nullable=false,length=24) private String role="USER";
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
    @PreUpdate void updateTime(){updatedAt=Instant.now();}
    public UserAccount() {}
    public String getId(){return id;} public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
    public String getRole(){return role;} public void setRole(String v){role=v;}
    public Instant getCreatedAt(){return createdAt;}
}
