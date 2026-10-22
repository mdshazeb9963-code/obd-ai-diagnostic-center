package com.obdai.diagnostic.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import java.time.Duration;
@Configuration
public class HttpClientConfig {
    @Bean RestClient.Builder restClientBuilder(){
        var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(Duration.ofSeconds(4));factory.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder().requestFactory(factory);
    }
    @Bean RestClient restClient(RestClient.Builder builder){
        return builder.build();
    }
}
