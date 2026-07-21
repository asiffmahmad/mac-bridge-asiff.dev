package com.bridge.macbridge.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${bridge.rate-limit.auth-rpm:60}")
    private int authRpm;

    @Value("${bridge.rate-limit.api-rpm:300}")
    private int apiRpm;

    // Map of IP + endpoint type -> [count, windowStart]
    private final Map<String, long[]> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();
        
        boolean isAuth = path.startsWith("/api/auth/") || path.startsWith("/api/pairing/");
        int limit = isAuth ? authRpm : apiRpm;
        
        String key = ip + (isAuth ? "_auth" : "_api");
        long now = System.currentTimeMillis();
        long windowStart = now - 60000; // 1 minute window
        
        requestCounts.compute(key, (k, v) -> {
            if (v == null || v[1] < windowStart) {
                return new long[]{1, now};
            }
            v[0]++;
            return v;
        });
        
        long[] data = requestCounts.get(key);
        if (data[0] > limit) {
            response.setStatus(429); // Too Many Requests
            response.getWriter().write("Rate limit exceeded");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
