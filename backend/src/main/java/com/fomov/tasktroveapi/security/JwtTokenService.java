package com.fomov.tasktroveapi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenService {

    private final String issuer;
    private final String audience;
    private final String secret;
    private final long expirationMillis;

    public JwtTokenService(
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.audience}") String audience,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.issuer = issuer;
        this.audience = audience;
        this.secret = secret;
        this.expirationMillis = java.time.Duration.ofMinutes(expirationMinutes).toMillis();
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(Integer userId, String role, Map<String, Object> additionalClaims) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMillis);

        var builder = Jwts.builder()
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(now)
                .notBefore(now)
                .expiration(exp)
                .claim("userId", userId)
                .claim("role", role);
        
        if (additionalClaims != null && !additionalClaims.isEmpty()) {
            builder.claims().add(additionalClaims);
        }
        
        return builder
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .requireAudience(audience)
                .requireIssuer(issuer)
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}


