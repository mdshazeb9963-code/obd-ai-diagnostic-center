package com.obdai.diagnostic.api;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth; private final ObdProperties properties;
    public AuthController(AuthService auth,ObdProperties properties){this.auth=auth;this.properties=properties;}
    @PostMapping("/register") ResponseEntity<ApiModels.AuthResponse> register(@Valid @RequestBody ApiModels.RegisterRequest body,HttpServletResponse response){
        AuthService.Session session=auth.register(body);setCookie(response,session.refreshToken());return ResponseEntity.ok(session.response());
    }
    @PostMapping("/login") ResponseEntity<ApiModels.AuthResponse> login(@Valid @RequestBody ApiModels.LoginRequest body,HttpServletResponse response){
        AuthService.Session session=auth.login(body);setCookie(response,session.refreshToken());return ResponseEntity.ok(session.response());
    }
    @PostMapping("/refresh") ResponseEntity<ApiModels.AuthResponse> refresh(@CookieValue(name="obd_refresh",required=false) String token,HttpServletResponse response){
        AuthService.Session session=auth.refresh(token);setCookie(response,session.refreshToken());return ResponseEntity.ok(session.response());
    }
    @PostMapping("/logout") ResponseEntity<Void> logout(@CookieValue(name="obd_refresh",required=false) String token,HttpServletResponse response){
        auth.logout(token);clearCookie(response);return ResponseEntity.noContent().build();
    }
    @GetMapping("/me") ApiModels.UserDto me(Authentication authentication){return auth.userDto((String)authentication.getPrincipal());}
    private void setCookie(HttpServletResponse response,String value){
        ResponseCookie cookie=ResponseCookie.from("obd_refresh",value).httpOnly(true).secure(properties.getSecurity().isSecureCookie())
            .sameSite("Strict").path("/api/v1/auth").maxAge(Duration.ofDays(properties.getSecurity().getRefreshDays())).build();
        response.addHeader(HttpHeaders.SET_COOKIE,cookie.toString());
    }
    private void clearCookie(HttpServletResponse response){
        ResponseCookie cookie=ResponseCookie.from("obd_refresh","").httpOnly(true).secure(properties.getSecurity().isSecureCookie())
            .sameSite("Strict").path("/api/v1/auth").maxAge(Duration.ZERO).build();response.addHeader(HttpHeaders.SET_COOKIE,cookie.toString());
    }
}
