package com.obdai.diagnostic.security;
import com.obdai.diagnostic.config.ObdProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder(12);}
    @Bean FilterRegistrationBean<JwtAuthenticationFilter> jwtServletRegistration(JwtAuthenticationFilter filter){
        FilterRegistrationBean<JwtAuthenticationFilter> registration=new FilterRegistrationBean<>(filter);registration.setEnabled(false);return registration;
    }
    @Bean FilterRegistrationBean<RateLimitFilter> rateLimitServletRegistration(RateLimitFilter filter){
        FilterRegistrationBean<RateLimitFilter> registration=new FilterRegistrationBean<>(filter);registration.setEnabled(false);return registration;
    }
    @Bean FilterRegistrationBean<OriginValidationFilter> originServletRegistration(OriginValidationFilter filter){
        FilterRegistrationBean<OriginValidationFilter> registration=new FilterRegistrationBean<>(filter);registration.setEnabled(false);return registration;
    }
    @Bean CorsConfigurationSource corsConfigurationSource(ObdProperties properties){
        CorsConfiguration config=new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(properties.getSecurity().getAllowedOrigins().split(",")).map(String::trim).toList());
        config.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","Accept","X-Requested-With"));
        config.setAllowCredentials(true);config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",config);return source;
    }
    @Bean SecurityFilterChain filterChain(HttpSecurity http,JwtAuthenticationFilter jwtFilter,RateLimitFilter rateLimitFilter,OriginValidationFilter originFilter)throws Exception{
        return http.cors(Customizer.withDefaults()).csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
            .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a.requestMatchers("/api/v1/auth/**","/api/v1/ai/speech-translation","/actuator/health","/docs","/docs/**","/openapi","/openapi/**","/swagger-ui/**","/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll().anyRequest().authenticated())
            .addFilterBefore(rateLimitFilter,UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(originFilter,RateLimitFilter.class)
            .addFilterBefore(jwtFilter,UsernamePasswordAuthenticationFilter.class).build();
    }
}
