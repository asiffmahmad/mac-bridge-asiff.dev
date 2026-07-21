package com.bridge.macbridge.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${bridge.jwt.key-file:#{systemProperties['user.home']}/.mac-bridge/jwt.key}")
    private String keyFilePath;

    @Value("${bridge.jwt.expiration:86400000}")
    private long jwtExpirationInMs;

    @Value("${bridge.jwt.refresh-expiration:604800000}")
    private long refreshExpirationInMs;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = loadOrGenerateKey();
    }

    /**
     * Loads an existing key from disk, or generates a new one and persists it.
     * This ensures tokens survive backend restarts.
     */
    private Key loadOrGenerateKey() {
        Path path = Paths.get(keyFilePath);
        try {
            if (Files.exists(path)) {
                byte[] keyBytes = Base64.getDecoder().decode(Files.readString(path).trim());
                return Keys.hmacShaKeyFor(keyBytes);
            } else {
                // Generate new key and persist
                Key newKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
                Files.createDirectories(path.getParent());
                Files.writeString(path, Base64.getEncoder().encodeToString(newKey.getEncoded()));
                System.out.println("[Mac Bridge] Generated new JWT signing key at " + path);
                return newKey;
            }
        } catch (IOException e) {
            System.err.println("[Mac Bridge] Warning: Could not persist JWT key to " + path + ". Using ephemeral key.");
            return Keys.secretKeyFor(SignatureAlgorithm.HS256);
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String extractType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    public String extractDeviceId(String token) {
        return extractClaim(token, claims -> claims.get("deviceId", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username) {
        return generateToken(username, null);
    }

    public String generateToken(String username, String deviceId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        if (deviceId != null) {
            claims.put("deviceId", deviceId);
        }
        return createToken(claims, username, jwtExpirationInMs);
    }

    public String generateRefreshToken(String username, String deviceId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        if (deviceId != null) {
            claims.put("deviceId", deviceId);
        }
        return createToken(claims, username, refreshExpirationInMs);
    }

    private String createToken(Map<String, Object> claims, String subject, long expirationMs) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public Boolean isRefreshToken(String token) {
        try {
            return "refresh".equals(extractType(token));
        } catch (Exception e) {
            return false;
        }
    }
}
