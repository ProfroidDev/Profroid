package com.profroid.profroidapp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * JWT Authentication Filter
 * Validates JWT tokens from the Authorization header and sets the security context
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret:Qt0K6UmrLyz5f4EfphuWm2xBBOY7yaaV}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Claims claims = validateAndGetClaims(token);
                
                if (claims != null) {
                    String userId = claims.getSubject();
                    String role = claims.get("role", String.class);
                    
                    // Create authorities list with the role
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    if (role != null && !role.isEmpty()) {
                        // Ensure role has ROLE_ prefix for Spring Security
                        String grantedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
                        authorities.add(new SimpleGrantedAuthority(grantedRole));
                    }
                    
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    
                    // Store in security context
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    log.debug("JWT validated for user: {} with role: {}", userId, role);
                }
            }
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }

    /**
     * Validate JWT token and extract claims using JJWT 0.11.x API
     */
    private Claims validateAndGetClaims(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            log.debug("JWT validation error: {}", e.getMessage());
            return null;
        }
    }
}
