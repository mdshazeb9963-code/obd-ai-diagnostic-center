package com.obdai.diagnostic.service;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.repo.CachedDiagnosticRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
@Component
public class DiagnosticCacheRefreshJob {
    private final CachedDiagnosticRepository cache;private final DiagnosticResolutionService resolver;
    private final StringRedisTemplate redis;private final ObdProperties properties;
    public DiagnosticCacheRefreshJob(CachedDiagnosticRepository cache,DiagnosticResolutionService resolver,StringRedisTemplate redis,ObdProperties properties){
        this.cache=cache;this.resolver=resolver;this.redis=redis;this.properties=properties;
    }
    @Scheduled(fixedDelay=3_600_000,initialDelay=90_000)
    public void refreshExpired(){
        if(!resolver.isConfigured())return;
        String lease=UUID.randomUUID().toString();
        try{
            Boolean acquired=redis.opsForValue().setIfAbsent("obd:job:diagnostic-refresh",lease,Duration.ofMinutes(50));
            if(!Boolean.TRUE.equals(acquired))return;
            for(var stale:cache.findTop100ByExpiresAtBeforeOrderByExpiresAtAsc(Instant.now())){
                resolver.invalidate(stale.getCode());
                resolver.resolve(stale.getCode());
            }
        }catch(Exception ignored){
            // Scheduled refresh is best-effort; the request path still resolves and caches codes on demand.
        }finally{
            try{if(lease.equals(redis.opsForValue().get("obd:job:diagnostic-refresh")))redis.delete("obd:job:diagnostic-refresh");}catch(Exception ignored){}
        }
    }
}
