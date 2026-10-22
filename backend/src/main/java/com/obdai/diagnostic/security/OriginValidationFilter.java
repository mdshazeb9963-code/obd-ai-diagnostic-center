package com.obdai.diagnostic.security;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
@Component
public class OriginValidationFilter extends OncePerRequestFilter {
    private final ObdProperties properties;private final ObjectMapper mapper;
    public OriginValidationFilter(ObdProperties properties,ObjectMapper mapper){this.properties=properties;this.mapper=mapper;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
        String path=request.getRequestURI();
        boolean cookieMutation="POST".equalsIgnoreCase(request.getMethod())&&
            (path.equals("/api/v1/auth/refresh")||path.equals("/api/v1/auth/logout"));
        if(cookieMutation){
            String origin=request.getHeader("Origin");
            boolean allowed=origin!=null&&Arrays.stream(properties.getSecurity().getAllowedOrigins().split(","))
                .map(String::trim).anyMatch(origin::equals);
            if(!allowed){response.setStatus(HttpServletResponse.SC_FORBIDDEN);response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(mapper.writeValueAsString(new ApiModels.ApiError("Request origin is not allowed.",Instant.now())));return;}
        }
        chain.doFilter(request,response);
    }
}
