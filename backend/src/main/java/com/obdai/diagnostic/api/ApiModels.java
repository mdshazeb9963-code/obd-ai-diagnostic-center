package com.obdai.diagnostic.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ApiModels {
    private ApiModels() {}
    public record RegisterRequest(@NotBlank @Size(min=2,max=120) String displayName,
                                  @NotBlank @Email @Size(max=254) String email,
                                  @NotBlank @Size(min=10,max=72) String password) {}
    public record LoginRequest(@NotBlank @Email String email,@NotBlank String password) {}
    public record UserDto(String id,String email,String displayName,String role) {}
    public record AuthResponse(String accessToken,long expiresInSeconds,UserDto user) {}
    public record ApiError(String message,Instant timestamp) {}

    public record VehicleRequest(@Size(max=17) String vin,@Size(max=100) String nickname,
                                 @Size(max=80) String make,@Size(max=100) String model,
                                 @Min(1886) @Max(2100) Integer year,@Size(max=120) String engine,
                                 @Size(max=80) String transmission,@Size(max=60) String fuelType,
                                 @Size(max=80) String region,@DecimalMin("0.1") @DecimalMax("99.9") BigDecimal displacementL,
                                 @PositiveOrZero Long mileage) {}
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VehicleDto(String id,String vin,String nickname,String make,String model,Integer year,
                             String engine,String transmission,String fuelType,String region,
                             BigDecimal displacementL,Long mileage,Instant createdAt,long reportCount) {}
    public record VinDecode(String vin,String make,String model,Integer year,String engine,
                            String transmission,String fuelType,String region,BigDecimal displacementL) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DiagnosticFinding(String code,String title,String description,List<String> symptoms,
                                    List<String> causes,String diagnosticProcedure,String repairProcedure,
                                    List<String> commonFixes,String safetyImpact,String severity,
                                    String drivingRecommendation,BigDecimal estimatedCostLow,
                                    BigDecimal estimatedCostHigh,String currency,String repairDifficulty,
                                    Integer estimatedMinutes,BigDecimal estimatedPartsLow,BigDecimal estimatedPartsHigh,
                                    BigDecimal estimatedLaborLow,BigDecimal estimatedLaborHigh,List<String> recommendedTools,
                                    List<String> commonParts,Double confidence,String source,Instant resolvedAt) {}
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ScanReportDto(String id,String fileName,String sourceFormat,String vehicleId,String vehicleName,
                                List<DiagnosticFinding> diagnostics,String summary,String aiAnalysis,
                                Integer healthScore,long uploadedBytes,Instant createdAt) {}
    public record AssistantRequest(@NotBlank @Size(max=1000) String message) {}
    public record AssistantResponse(String answer,String model,Instant generatedAt) {}
    public record SubscriptionDto(String planCode,String status,long scansUsed,long scanLimit,
                                 Instant currentPeriodStart,Instant currentPeriodEnd) {}
    public record NotificationDto(String id,String category,String title,String body,Instant readAt,Instant createdAt) {}
    public record MaintenanceRequest(@NotBlank @Size(max=140) String title,@Size(max=1000) String notes,
                                    Instant performedAt,java.math.BigDecimal cost,Long mileage) {}
    public record MaintenanceDto(String id,String vehicleId,String title,String notes,Instant performedAt,
                                 java.math.BigDecimal cost,Long mileage,Instant createdAt) {}
    public record AdminOverview(long users,long reports,long vehicles,long unresolvedCodes,
                                boolean aiConfigured,boolean diagnosticProviderConfigured,
                                boolean redisReachable,Instant generatedAt) {}
}
