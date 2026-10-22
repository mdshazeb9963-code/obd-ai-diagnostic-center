package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.CachedDiagnostic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
public interface CachedDiagnosticRepository extends JpaRepository<CachedDiagnostic,String> {
    List<CachedDiagnostic> findTop100ByExpiresAtBeforeOrderByExpiresAtAsc(Instant now);
}
