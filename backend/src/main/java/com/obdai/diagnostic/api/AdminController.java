package com.obdai.diagnostic.api;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.domain.AuditLog;
import com.obdai.diagnostic.domain.Subscription;
import com.obdai.diagnostic.repo.*;
import com.obdai.diagnostic.service.DiagnosticResolutionService;
import com.obdai.diagnostic.service.ScanService;
import com.obdai.diagnostic.service.AiDiagnosticService;
import com.obdai.diagnostic.service.LocalFileStorageService;
import com.obdai.diagnostic.service.AuditService;
import com.obdai.diagnostic.service.SubscriptionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;
@RestController @RequestMapping("/api/v1/admin") @PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserAccountRepository users;private final VehicleRepository vehicles;private final ScanReportRepository reports;
    private final CachedDiagnosticRepository cache;private final SubscriptionRepository plans;private final DiagnosticResolutionService resolver;
    private final StringRedisTemplate redis;private final ObdProperties properties;private final AiDiagnosticService ai;private final AuditLogRepository audit;
    private final LocalFileStorageService storage;private final AuditService auditService;
    private final SubscriptionService subscriptionService;
    public AdminController(UserAccountRepository users,VehicleRepository vehicles,ScanReportRepository reports,CachedDiagnosticRepository cache,
                           SubscriptionRepository plans,DiagnosticResolutionService resolver,StringRedisTemplate redis,ObdProperties properties,
                           AiDiagnosticService ai,AuditLogRepository audit,LocalFileStorageService storage,AuditService auditService,SubscriptionService subscriptionService){
        this.users=users;this.vehicles=vehicles;this.reports=reports;this.cache=cache;this.plans=plans;this.resolver=resolver;this.redis=redis;
        this.properties=properties;this.ai=ai;this.audit=audit;this.storage=storage;this.auditService=auditService;this.subscriptionService=subscriptionService;
    }
    @GetMapping("/overview") ApiModels.AdminOverview overview(){
        boolean redisOk=false;try{redisOk="PONG".equalsIgnoreCase(redis.getConnectionFactory().getConnection().ping());}catch(Exception ignored){}
        return new ApiModels.AdminOverview(users.count(),reports.count(),vehicles.count(),cache.count(),ai.isConfigured(),
            resolver.isConfigured(),redisOk,Instant.now());
    }
    @GetMapping("/users") List<Map<String,Object>> users(@RequestParam(defaultValue="100") int limit){
        return users.findAll(PageRequest.of(0,Math.max(1,Math.min(limit,200)))).stream().map(u->{
            var sub=plans.findByUserId(u.getId()).orElse(null);
            return Map.<String,Object>of("id",u.getId(),"email",u.getEmail(),"displayName",u.getDisplayName(),"role",u.getRole(),"planCode",sub==null?"FREE":sub.getPlanCode());
        }).toList();
    }
    @GetMapping("/reports") List<ApiModels.ScanReportDto> reports(@RequestParam(defaultValue="100") int limit){
        return reports.findAllByOrderByCreatedAtDesc(PageRequest.of(0,Math.max(1,Math.min(limit,200))))
            .stream().map(r->new ApiModels.ScanReportDto(r.getId(),r.getOriginalFileName(),r.getSourceFormat(),r.getVehicleId(),null,List.of(),r.getSummary(),r.getAiAnalysis(),r.getHealthScore(),r.getUploadedBytes(),r.getCreatedAt())).toList();
    }
    @DeleteMapping("/reports/{id}") void deleteReport(Authentication auth,@PathVariable String id){
        var report=reports.findById(id).orElseThrow(()->ApiException.notFound("Report not found."));
        reports.delete(report);storage.delete(report.getStorageKey());auditService.record((String)auth.getPrincipal(),"ADMIN_REPORT_DELETED","REPORT",id);
    }
    @GetMapping("/uploads") List<Map<String,Object>> uploads(@RequestParam(defaultValue="100") int limit){
        return reports.findAllByOrderByCreatedAtDesc(PageRequest.of(0,Math.max(1,Math.min(limit,200)))).stream()
            .map(r->Map.<String,Object>of("id",r.getId(),"fileName",r.getOriginalFileName(),"sourceFormat",r.getSourceFormat(),"uploadedBytes",r.getUploadedBytes(),"createdAt",r.getCreatedAt(),"available",r.getStorageKey()!=null)).toList();
    }
    @GetMapping("/uploads/{id}") ResponseEntity<byte[]> reviewUpload(@PathVariable String id){
        var report=reports.findById(id).orElseThrow(()->ApiException.notFound("Upload not found."));
        byte[] data=storage.read(report.getStorageKey());String safe=report.getOriginalFileName().replaceAll("[\\\\\"\\r\\n]","_");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+safe+"\"").body(data);
    }
    @GetMapping("/vehicles") List<ApiModels.VehicleDto> vehicles(){
        return vehicles.findAll(PageRequest.of(0,200)).stream().map(v->new ApiModels.VehicleDto(v.getId(),v.getVin(),v.getNickname(),v.getMake(),v.getModel(),v.getYear(),
            v.getEngine(),v.getTransmission(),v.getFuelType(),v.getRegion(),v.getDisplacementL(),v.getMileage(),v.getCreatedAt(),reports.countByVehicleId(v.getId()))).toList();
    }
    @GetMapping("/plans") List<Map<String,Object>> planCatalog(){
        return List.of(Map.of("code","FREE","scanLimit",properties.getLimits().getFreeScansPerMonth(),"billing","manual"),
            Map.of("code","PRO","scanLimit",100,"billing","manual"),Map.of("code","GARAGE","scanLimit",500,"billing","manual"),
            Map.of("code","ENTERPRISE","scanLimit",-1,"billing","contract"));
    }
    @PutMapping("/users/{id}/plan") ApiModels.SubscriptionDto setPlan(Authentication auth,@PathVariable String id,@RequestBody Map<String,String> body){
        if(!users.existsById(id))throw ApiException.notFound("User not found.");
        String code=body.getOrDefault("planCode","").toUpperCase();
        if(!List.of("FREE","PRO","GARAGE","ENTERPRISE").contains(code))throw ApiException.badRequest("Unsupported plan.");
        Subscription sub=plans.findByUserId(id).orElseGet(()->new Subscription(id));sub.setPlanCode(code);plans.save(sub);
        audit.save(new AuditLog((String)auth.getPrincipal(),"PLAN_CHANGED","SUBSCRIPTION",id));
        long limit=switch(code){case "PRO"->100;case "GARAGE"->500;case "ENTERPRISE"->-1;default->properties.getLimits().getFreeScansPerMonth();};
        return subscriptionService.current(id);
    }
    @PutMapping("/users/{id}/role") ApiModels.UserDto setRole(Authentication auth,@PathVariable String id,@RequestBody Map<String,String> body){
        var user=users.findById(id).orElseThrow(()->ApiException.notFound("User not found."));
        if(id.equals(auth.getPrincipal()))throw ApiException.badRequest("An administrator cannot change their own role.");
        String role=body.getOrDefault("role","").toUpperCase();
        if(!List.of("USER","ADMIN").contains(role))throw ApiException.badRequest("Role must be USER or ADMIN.");
        user.setRole(role);users.save(user);auditService.record((String)auth.getPrincipal(),"USER_ROLE_CHANGED","USER",id);
        return new ApiModels.UserDto(user.getId(),user.getEmail(),user.getDisplayName(),user.getRole());
    }
    @PostMapping("/cache/{code}/refresh") ApiModels.DiagnosticFinding refresh(@PathVariable String code){
        if(!code.matches("(?i)[PCBU][0-3][A-F0-9]{3}"))throw ApiException.badRequest("Invalid diagnostic code format.");
        resolver.invalidate(code);return resolver.resolve(code);
    }
}
