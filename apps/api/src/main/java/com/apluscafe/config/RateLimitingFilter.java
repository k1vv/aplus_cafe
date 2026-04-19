package com.apluscafe.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Rate limit: 100 requests per minute per IP
    private static final int REQUESTS_PER_MINUTE = 100;

    // Stricter rate limit for auth endpoints: 10 requests per minute per IP
    private static final int AUTH_REQUESTS_PER_MINUTE = 10;

    // Payment endpoints: 5 requests per minute per IP
    private static final int PAYMENT_REQUESTS_PER_MINUTE = 5;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> paymentBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIP(request);
        String path = request.getRequestURI();

        // Skip rate limiting for health check endpoints
        if (path.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket;
        String limitType;

        // Apply different rate limits based on endpoint
        if (path.startsWith("/api/auth")) {
            bucket = authBuckets.computeIfAbsent(clientIp, this::createAuthBucket);
            limitType = "auth";
        } else if (path.startsWith("/api/payments") || path.startsWith("/api/checkout")) {
            bucket = paymentBuckets.computeIfAbsent(clientIp, this::createPaymentBucket);
            limitType = "payment";
        } else {
            bucket = buckets.computeIfAbsent(clientIp, this::createBucket);
            limitType = "general";
        }

        if (bucket.tryConsume(1)) {
            // Add rate limit headers
            response.addHeader("X-RateLimit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} on {} endpoint: {}", clientIp, limitType, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests. Please try again later.\", \"retryAfter\": 60}");
        }
    }

    private Bucket createBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_MINUTE, Refill.intervally(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build();
    }

    private Bucket createAuthBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(AUTH_REQUESTS_PER_MINUTE, Refill.intervally(AUTH_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build();
    }

    private Bucket createPaymentBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(PAYMENT_REQUESTS_PER_MINUTE, Refill.intervally(PAYMENT_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }
}
