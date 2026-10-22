package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="subscriptions")
public class Subscription {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="user_id",nullable=false,unique=true,length=36) private String userId;
    @Column(name="plan_code",nullable=false,length=24) private String planCode="FREE";
    @Column(nullable=false,length=24) private String status="ACTIVE";
    @Column(name="current_period_start",nullable=false) private Instant currentPeriodStart=Instant.now();
    @Column(name="current_period_end") private Instant currentPeriodEnd;
    @Column(name="external_customer_id",length=160) private String externalCustomerId;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public Subscription() {}
    public Subscription(String userId){this.userId=userId;}
    public String getId(){return id;} public String getUserId(){return userId;} public String getPlanCode(){return planCode;}
    public String getStatus(){return status;}
    public void setPlanCode(String value){planCode=value;}
    public Instant getCurrentPeriodStart(){return currentPeriodStart;}
    public Instant getCurrentPeriodEnd(){return currentPeriodEnd;}
}
