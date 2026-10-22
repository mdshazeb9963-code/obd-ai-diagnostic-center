package com.obdai.diagnostic.security;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private record Window(long minute,AtomicInteger count){}
    private final StringRedisTemplate redis;private final ObjectMapper mapper;private final ObdProperties properties;
    private final ConcurrentHashMap<String,Window> fallback=new ConcurrentHashMap<>();
    private final AtomicInteger requests=new AtomicInteger();
    public RateLimitFilter(StringRedisTemplate redis,ObjectMapper mapper,ObdProperties properties){this.redis=redis;this.mapper=mapper;this.properties=properties;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
        String path=req.getRequestURI();
        if(path.startsWith("/actuator/")||path.startsWith("/docs")||path.startsWith("/openapi")||path.startsWith("/swagger-ui")){chain.doFilter(req,res);return;}
        long minute=Instant.now().getEpochSecond()/60;
        int limit=path.startsWith("/api/v1/auth/")?12:properties.getLimits().getRequestPerMinute();
        String bucket=path.startsWith("/api/v1/auth/")?"auth":path.equals("/api/v1/scans/upload")?"scan":"api";
        if(path.equals("/api/v1/scans/upload"))limit=30;
        String key="obd:rate:"+req.getRemoteAddr()+":"+bucket+":"+minute;
        boolean allowed=true;
        try{
            Long count=redis.opsForValue().increment(key);
            if(count!=null){if(count==1)redis.expire(key,java.time.Duration.ofSeconds(70));allowed=count<=limit;}
        }catch(Exception e){
            String localKey=req.getRemoteAddr()+":"+bucket;Window w=fallback.compute(localKey,(k,old)->old==null||old.minute()!=minute?new Window(minute,new AtomicInteger(0)):old);
            allowed=w.count().incrementAndGet()<=limit;
            if(requests.incrementAndGet()%500==0)fallback.entrySet().removeIf(entry->entry.getValue().minute()<minute-2);
        }
        if(!allowed){res.setStatus(429);res.setContentType(MediaType.APPLICATION_JSON_VALUE);res.getWriter().write(mapper.writeValueAsString(new ApiModels.ApiError("Request limit reached. Wait a moment and try again.",Instant.now())));return;}
        chain.doFilter(req,res);
    }
}
