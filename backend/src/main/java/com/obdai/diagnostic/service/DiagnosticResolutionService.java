package com.obdai.diagnostic.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.domain.CachedDiagnostic;
import com.obdai.diagnostic.repo.CachedDiagnosticRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class DiagnosticResolutionService {
    private final StringRedisTemplate redis; private final CachedDiagnosticRepository cache;
    private final RestClient client; private final ObjectMapper mapper; private final ObdProperties properties;
    public DiagnosticResolutionService(StringRedisTemplate redis,CachedDiagnosticRepository cache,RestClient client,ObjectMapper mapper,ObdProperties properties){
        this.redis=redis;this.cache=cache;this.client=client;this.mapper=mapper;this.properties=properties;
    }
    public ApiModels.DiagnosticFinding resolve(String code){
        String normalized=code.toUpperCase(Locale.ROOT),key="obd:diagnostic:"+normalized;
        try{
            String cached=redis.opsForValue().get(key);
            if(cached!=null)return mapper.readValue(cached,ApiModels.DiagnosticFinding.class);
        }catch(Exception ignored){}
        var db=cache.findById(normalized).filter(c->c.getExpiresAt().isAfter(Instant.now()));
        if(db.isPresent()){
            try{
                ApiModels.DiagnosticFinding value=mapper.readValue(db.get().getPayloadJson(),ApiModels.DiagnosticFinding.class);
                putRedis(key,db.get().getPayloadJson());return value;
            }catch(Exception ignored){}
        }
        ApiModels.DiagnosticFinding found=queryProvider(normalized);
        if(found==null)return unresolved(normalized);
        try{
            String payload=mapper.writeValueAsString(found);
            Instant expires=Instant.now().plus(Duration.ofDays(properties.getDiagnostics().getCacheDays()));
            cache.save(new CachedDiagnostic(normalized,payload,found.source()==null?"configured-provider":found.source(),expires));putRedis(key,payload);
        }catch(Exception ignored){}
        return found;
    }
    private ApiModels.DiagnosticFinding queryProvider(String code){
        List<ApiModels.DiagnosticFinding> results=properties.getDiagnostics().urls().stream().map(base->queryOne(base,code)).filter(java.util.Objects::nonNull).toList();
        if(results.isEmpty())return null;
        ApiModels.DiagnosticFinding primary=results.stream().max(java.util.Comparator.comparingDouble(f->f.confidence()==null?0:f.confidence())).orElse(results.get(0));
        String severity=results.stream().map(f->allowedSeverity(f.severity())).distinct().count()==1?allowedSeverity(primary.severity()):"UNKNOWN";
        List<String> sources=results.stream().map(ApiModels.DiagnosticFinding::source).filter(s->s!=null&&!s.isBlank()).distinct().toList();
        double confidence=results.stream().map(ApiModels.DiagnosticFinding::confidence).filter(java.util.Objects::nonNull).mapToDouble(Double::doubleValue).average().orElse(0);
        boolean severityAgrees=severity.equals(allowedSeverity(primary.severity()))&&!"UNKNOWN".equals(severity);
        return new ApiModels.DiagnosticFinding(code,first(results,ApiModels.DiagnosticFinding::title),first(results,ApiModels.DiagnosticFinding::description),
            merge(results,ApiModels.DiagnosticFinding::symptoms),merge(results,ApiModels.DiagnosticFinding::causes),
            first(results,ApiModels.DiagnosticFinding::diagnosticProcedure),first(results,ApiModels.DiagnosticFinding::repairProcedure),
            merge(results,ApiModels.DiagnosticFinding::commonFixes),severityAgrees?first(results,ApiModels.DiagnosticFinding::safetyImpact):null,
            severity,severityAgrees?first(results,ApiModels.DiagnosticFinding::drivingRecommendation):"Provider severity values did not agree; verify with a qualified technician.",
            sameMoney(results,ApiModels.DiagnosticFinding::estimatedCostLow),sameMoney(results,ApiModels.DiagnosticFinding::estimatedCostHigh),
            currencyAgrees(results)?first(results,ApiModels.DiagnosticFinding::currency):null,first(results,ApiModels.DiagnosticFinding::repairDifficulty),
            primary.estimatedMinutes(),sameMoney(results,ApiModels.DiagnosticFinding::estimatedPartsLow),sameMoney(results,ApiModels.DiagnosticFinding::estimatedPartsHigh),
            sameMoney(results,ApiModels.DiagnosticFinding::estimatedLaborLow),sameMoney(results,ApiModels.DiagnosticFinding::estimatedLaborHigh),
            merge(results,ApiModels.DiagnosticFinding::recommendedTools),merge(results,ApiModels.DiagnosticFinding::commonParts),
            confidence>0?confidence:null,String.join(" + ",sources),Instant.now());
    }
    private ApiModels.DiagnosticFinding queryOne(String base,String code){
        try{
            var request=client.get().uri(base.replaceAll("/+$","")+"/codes/{code}",code);
            String apiKey=properties.getDiagnostics().getProviderApiKey();
            if(apiKey!=null&&!apiKey.isBlank())request.header("Authorization","Bearer "+apiKey);
            ApiModels.DiagnosticFinding response=request.retrieve().body(ApiModels.DiagnosticFinding.class);
            if(response==null||response.code()==null||!response.code().equalsIgnoreCase(code))return null;
            return new ApiModels.DiagnosticFinding(code,response.title(),response.description(),safe(response.symptoms()),safe(response.causes()),
                response.diagnosticProcedure(),response.repairProcedure(),safe(response.commonFixes()),response.safetyImpact(),
                allowedSeverity(response.severity()),response.drivingRecommendation(),response.estimatedCostLow(),response.estimatedCostHigh(),
                response.currency(),response.repairDifficulty(),response.estimatedMinutes(),response.estimatedPartsLow(),response.estimatedPartsHigh(),
                response.estimatedLaborLow(),response.estimatedLaborHigh(),safe(response.recommendedTools()),safe(response.commonParts()),
                boundedConfidence(response.confidence()),response.source()==null?base:response.source(),Instant.now());
        }catch(Exception ignored){return null;}
    }
    private Double boundedConfidence(Double value){return value==null?null:Math.max(0,Math.min(1,value));}
    private String first(List<ApiModels.DiagnosticFinding> rows,java.util.function.Function<ApiModels.DiagnosticFinding,String> get){return rows.stream().map(get).filter(v->v!=null&&!v.isBlank()).findFirst().orElse(null);}
    private List<String> merge(List<ApiModels.DiagnosticFinding> rows,java.util.function.Function<ApiModels.DiagnosticFinding,List<String>> get){return rows.stream().map(get).filter(java.util.Objects::nonNull).flatMap(List::stream).filter(v->v!=null&&!v.isBlank()).distinct().limit(40).toList();}
    private java.math.BigDecimal sameMoney(List<ApiModels.DiagnosticFinding> rows,java.util.function.Function<ApiModels.DiagnosticFinding,java.math.BigDecimal> get){
        List<java.math.BigDecimal> values=rows.stream().map(get).filter(java.util.Objects::nonNull).distinct().toList();return values.size()==1?values.get(0):null;
    }
    private boolean currencyAgrees(List<ApiModels.DiagnosticFinding> rows){List<String> values=rows.stream().map(ApiModels.DiagnosticFinding::currency).filter(v->v!=null&&!v.isBlank()).distinct().toList();return values.size()<=1;}
    private String allowedSeverity(String value){
        if(value==null)return "UNKNOWN";
        String v=value.toUpperCase(Locale.ROOT);
        return List.of("INFO","LOW","MEDIUM","HIGH","CRITICAL","UNKNOWN").contains(v)?v:"UNKNOWN";
    }
    private List<String> safe(List<String> v){return v==null?List.of():v;}
    private ApiModels.DiagnosticFinding unresolved(String code){
        return new ApiModels.DiagnosticFinding(code,"Code not resolved",
            "The code was extracted from the scan, but no configured diagnostic data provider returned a verified description. No repair or severity conclusion is available.",
            List.of(),List.of(),null,null,List.of(),null,"UNKNOWN","Have the code identified with a trusted automotive reference before acting.",
            null,null,null,null,null,null,null,null,null,List.of(),List.of(),0.0,"Unresolved",null);
    }
    private void putRedis(String key,String value){try{redis.opsForValue().set(key,value,Duration.ofDays(properties.getDiagnostics().getCacheDays()));}catch(Exception ignored){}}
    public void invalidate(String code){try{redis.delete("obd:diagnostic:"+code.toUpperCase(Locale.ROOT));}catch(Exception ignored){}cache.deleteById(code.toUpperCase(Locale.ROOT));}
    public boolean isConfigured(){return !properties.getDiagnostics().urls().isEmpty();}
}
