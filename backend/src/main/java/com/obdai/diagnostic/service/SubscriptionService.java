package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.domain.Subscription;
import com.obdai.diagnostic.repo.ScanReportRepository;
import com.obdai.diagnostic.repo.SubscriptionRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalDate;
@Service
public class SubscriptionService {
    private final SubscriptionRepository subscriptions;private final ScanReportRepository reports;private final ObdProperties properties;
    public SubscriptionService(SubscriptionRepository subscriptions,ScanReportRepository reports,ObdProperties properties){this.subscriptions=subscriptions;this.reports=reports;this.properties=properties;}
    public ApiModels.SubscriptionDto current(String userId){
        Subscription sub=subscriptions.findByUserId(userId).orElseGet(()->subscriptions.save(new Subscription(userId)));
        Instant start=LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        long used=reports.countByOwnerIdAndCreatedAtGreaterThanEqual(userId,start);
        return new ApiModels.SubscriptionDto(sub.getPlanCode(),sub.getStatus(),used,limit(sub.getPlanCode()),sub.getCurrentPeriodStart(),sub.getCurrentPeriodEnd());
    }
    public void assertScanAllowed(String userId){
        ApiModels.SubscriptionDto current=current(userId);
        if(current.scanLimit()>=0&&current.scansUsed()>=current.scanLimit())
            throw ApiException.tooMany("Your "+current.planCode()+" plan scan limit has been reached for this month.");
    }
    private long limit(String plan){return switch(plan.toUpperCase()){case "PRO"->100;case "GARAGE"->500;case "ENTERPRISE"->-1;default->properties.getLimits().getFreeScansPerMonth();};}
}
