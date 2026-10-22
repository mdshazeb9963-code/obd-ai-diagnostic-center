package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="refresh_tokens",indexes=@Index(name="idx_refresh_user",columnList="user_id,expires_at"))
public class RefreshToken {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="user_id",nullable=false,length=36) private String userId;
    @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash;
    @Column(name="expires_at",nullable=false) private Instant expiresAt;
    @Column(name="revoked_at") private Instant revokedAt;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public RefreshToken() {}
    public RefreshToken(String userId,String hash,Instant expiry){this.userId=userId;this.tokenHash=hash;this.expiresAt=expiry;}
    public String getId(){return id;} public String getUserId(){return userId;} public String getTokenHash(){return tokenHash;}
    public Instant getExpiresAt(){return expiresAt;} public Instant getRevokedAt(){return revokedAt;} public void setRevokedAt(Instant v){revokedAt=v;}
}
