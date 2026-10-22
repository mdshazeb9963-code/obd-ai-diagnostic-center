package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.domain.RefreshToken;
import com.obdai.diagnostic.domain.Subscription;
import com.obdai.diagnostic.domain.UserAccount;
import com.obdai.diagnostic.repo.RefreshTokenRepository;
import com.obdai.diagnostic.repo.SubscriptionRepository;
import com.obdai.diagnostic.repo.UserAccountRepository;
import com.obdai.diagnostic.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class AuthService {
    public record Session(ApiModels.AuthResponse response,String refreshToken) {}
    private final UserAccountRepository users; private final RefreshTokenRepository tokens;
    private final SubscriptionRepository subscriptions; private final PasswordEncoder encoder;
    private final JwtService jwt; private final ObdProperties properties; private final AuditService audit;
    private final SecureRandom random=new SecureRandom();
    public AuthService(UserAccountRepository users,RefreshTokenRepository tokens,SubscriptionRepository subscriptions,
                       PasswordEncoder encoder,JwtService jwt,ObdProperties properties,AuditService audit){
        this.users=users;this.tokens=tokens;this.subscriptions=subscriptions;this.encoder=encoder;this.jwt=jwt;this.properties=properties;this.audit=audit;
    }
    @Transactional
    public Session register(ApiModels.RegisterRequest request){
        String email=request.email().trim().toLowerCase();
        if(users.existsByEmailIgnoreCase(email))throw ApiException.conflict("An account with that email already exists.");
        UserAccount user=new UserAccount();user.setEmail(email);user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(encoder.encode(request.password()));users.save(user);subscriptions.save(new Subscription(user.getId()));
        audit.record(user.getId(),"ACCOUNT_REGISTERED","USER",user.getId());
        return newSession(user);
    }
    @Transactional
    public Session login(ApiModels.LoginRequest request){
        UserAccount user=users.findByEmailIgnoreCase(request.email().trim()).orElseThrow(ApiException::unauthorized);
        if(!encoder.matches(request.password(),user.getPasswordHash()))throw ApiException.unauthorized();
        audit.record(user.getId(),"ACCOUNT_LOGIN","USER",user.getId());
        return newSession(user);
    }
    @Transactional
    public Session refresh(String rawToken){
        if(rawToken==null||rawToken.isBlank())throw ApiException.unauthorized();
        RefreshToken old=tokens.findByTokenHash(hash(rawToken)).orElseThrow(ApiException::unauthorized);
        if(old.getRevokedAt()!=null||!old.getExpiresAt().isAfter(Instant.now()))throw ApiException.unauthorized();
        old.setRevokedAt(Instant.now());tokens.save(old);
        UserAccount user=users.findById(old.getUserId()).orElseThrow(ApiException::unauthorized);
        return newSession(user);
    }
    @Transactional
    public void logout(String rawToken){
        if(rawToken==null||rawToken.isBlank())return;
        tokens.findByTokenHash(hash(rawToken)).ifPresent(token->{token.setRevokedAt(Instant.now());tokens.save(token);});
    }
    public ApiModels.UserDto userDto(String id){return users.findById(id).map(this::dto).orElseThrow(ApiException::unauthorized);}
    private Session newSession(UserAccount user){
        byte[] bytes=new byte[48];random.nextBytes(bytes);
        String raw=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires=Instant.now().plus(properties.getSecurity().getRefreshDays(),ChronoUnit.DAYS);
        tokens.save(new RefreshToken(user.getId(),hash(raw),expires));
        return new Session(new ApiModels.AuthResponse(jwt.issue(user),jwt.getLifetimeSeconds(),dto(user)),raw);
    }
    private ApiModels.UserDto dto(UserAccount u){return new ApiModels.UserDto(u.getId(),u.getEmail(),u.getDisplayName(),u.getRole());}
    private String hash(String raw){
        try{return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));}
        catch(Exception e){throw new IllegalStateException("SHA-256 is unavailable",e);}
    }
}
