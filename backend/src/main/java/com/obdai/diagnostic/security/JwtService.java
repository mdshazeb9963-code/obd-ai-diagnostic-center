package com.obdai.diagnostic.security;
import com.obdai.diagnostic.config.ObdProperties;
import com.obdai.diagnostic.domain.UserAccount;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
@Service
public class JwtService {
    private final SecretKey key;
    private final long lifetimeSeconds;
    public JwtService(ObdProperties properties) {
        String secret=properties.getSecurity().getJwtSecret();
        if(secret==null||secret.isBlank())throw new IllegalStateException("JWT_SECRET must be set to a base64-encoded key with at least 32 random bytes.");
        this.key=Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.lifetimeSeconds=properties.getSecurity().getAccessMinutes()*60;
    }
    public String issue(UserAccount user) {
        Instant now=Instant.now();
        return Jwts.builder().subject(user.getId()).claim("role",user.getRole())
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(lifetimeSeconds))).signWith(key).compact();
    }
    public String subject(String jwt) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload().getSubject();
    }
    public long getLifetimeSeconds(){return lifetimeSeconds;}
}
