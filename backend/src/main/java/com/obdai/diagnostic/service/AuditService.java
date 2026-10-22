package com.obdai.diagnostic.service;
import com.obdai.diagnostic.domain.AuditLog;
import com.obdai.diagnostic.repo.AuditLogRepository;
import org.springframework.stereotype.Service;
@Service
public class AuditService {
    private final AuditLogRepository logs;
    public AuditService(AuditLogRepository logs){this.logs=logs;}
    public void record(String actor,String action,String type,String id){logs.save(new AuditLog(actor,action,type,id));}
}
