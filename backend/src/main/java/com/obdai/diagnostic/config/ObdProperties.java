package com.obdai.diagnostic.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix="obd")
public class ObdProperties {
    private final Security security = new Security();
    private final Diagnostics diagnostics = new Diagnostics();
    private final Ai ai = new Ai();
    private final Vin vin = new Vin();
    private final Limits limits = new Limits();
    private final Storage storage = new Storage();
    public Security getSecurity(){return security;} public Diagnostics getDiagnostics(){return diagnostics;}
    public Ai getAi(){return ai;} public Vin getVin(){return vin;} public Limits getLimits(){return limits;}
    public Storage getStorage(){return storage;}
    public static class Security {
        private String jwtSecret; private long accessMinutes=15; private long refreshDays=30; private boolean secureCookie;
        private String allowedOrigins="http://localhost:5173";
        public String getJwtSecret(){return jwtSecret;} public void setJwtSecret(String v){jwtSecret=v;}
        public long getAccessMinutes(){return accessMinutes;} public void setAccessMinutes(long v){accessMinutes=v;}
        public long getRefreshDays(){return refreshDays;} public void setRefreshDays(long v){refreshDays=v;}
        public boolean isSecureCookie(){return secureCookie;} public void setSecureCookie(boolean v){secureCookie=v;}
        public String getAllowedOrigins(){return allowedOrigins;} public void setAllowedOrigins(String v){allowedOrigins=v;}
    }
    public static class Diagnostics {
        private String providerUrl; private String providerUrls; private String providerApiKey; private int cacheDays=7;
        public String getProviderUrl(){return providerUrl;} public void setProviderUrl(String v){providerUrl=v;}
        public String getProviderUrls(){return providerUrls;} public void setProviderUrls(String v){providerUrls=v;}
        public String getProviderApiKey(){return providerApiKey;} public void setProviderApiKey(String v){providerApiKey=v;}
        public int getCacheDays(){return cacheDays;} public void setCacheDays(int v){cacheDays=v;}
        public java.util.List<String> urls(){
            java.util.LinkedHashSet<String> values=new java.util.LinkedHashSet<>();
            if(providerUrl!=null&&!providerUrl.isBlank())values.add(providerUrl.trim());
            if(providerUrls!=null)java.util.Arrays.stream(providerUrls.split(",")).map(String::trim).filter(s->!s.isBlank()).forEach(values::add);
            return java.util.List.copyOf(values);
        }
    }
    public static class Ai {
        private String apiKey; private String model="gpt-4.1-mini"; private String baseUrl="https://api.openai.com/v1";
        public String getApiKey(){return apiKey;} public void setApiKey(String v){apiKey=v;}
        public String getModel(){return model;} public void setModel(String v){model=v;}
        public String getBaseUrl(){return baseUrl;} public void setBaseUrl(String v){baseUrl=v;}
    }
    public static class Vin {
        private String baseUrl="https://vpic.nhtsa.dot.gov/api";
        public String getBaseUrl(){return baseUrl;} public void setBaseUrl(String v){baseUrl=v;}
    }
    public static class Limits {
        private int freeScansPerMonth=10; private int requestPerMinute=120;
        public int getFreeScansPerMonth(){return freeScansPerMonth;} public void setFreeScansPerMonth(int v){freeScansPerMonth=v;}
        public int getRequestPerMinute(){return requestPerMinute;} public void setRequestPerMinute(int v){requestPerMinute=v;}
    }
    public static class Storage {
        private String directory="./data/uploads";
        public String getDirectory(){return directory;} public void setDirectory(String v){directory=v;}
    }
}
