package com.obdai.diagnostic.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="notifications",indexes=@Index(name="idx_notification_user",columnList="user_id,created_at"))
public class Notification {
    @Id @Column(length=36) private String id=UUID.randomUUID().toString();
    @Column(name="user_id",nullable=false,length=36) private String userId;
    @Column(nullable=false,length=32) private String category;
    @Column(nullable=false,length=180) private String title;
    @Column(nullable=false,columnDefinition="text") private String body;
    @Column(name="read_at") private Instant readAt;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now();
    public Notification() {}
    public Notification(String userId,String category,String title,String body){this.userId=userId;this.category=category;this.title=title;this.body=body;}
    public String getId(){return id;} public String getUserId(){return userId;} public String getCategory(){return category;}
    public String getTitle(){return title;} public String getBody(){return body;} public Instant getReadAt(){return readAt;}
    public void setReadAt(Instant value){readAt=value;} public Instant getCreatedAt(){return createdAt;}
}
