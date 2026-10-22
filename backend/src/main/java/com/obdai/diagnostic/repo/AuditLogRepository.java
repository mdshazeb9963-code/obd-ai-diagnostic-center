package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditLogRepository extends JpaRepository<AuditLog,Long> {}
