package com.profroid.profroidapp.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Profile("!test")
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())   // <-- uses your WebConfig CORS
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                        .disable()
                )
                .headers(headers -> headers
                        .frameOptions(frame -> frame.disable())
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exc -> exc
                        // Custom 401 Unauthorized handler
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ObjectMapper mapper = new ObjectMapper();
                            String errorBody = mapper.writeValueAsString(Map.of(
                                    "error", "Unauthorized",
                                    "message", "Authentication required",
                                    "code", "UNAUTHORIZED"
                            ));
                            response.getWriter().write(errorBody);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no auth required
                        .requestMatchers(HttpMethod.POST, "/v1/customers").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/contact/messages").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/warranty-claims").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/files/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/jobs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/jobs/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/payments/webhook").permitAll()
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/info").permitAll()
                        .requestMatchers("/actuator/health/**", "/api/actuator/health/**").permitAll()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * SecurityService bean for custom authorization checks
     * Allows checking if the current authenticated user matches a given user ID
     */
    @Bean("securityService")
    public SecurityService securityService() {
        return new SecurityService();
    }

    /**
     * Service class for security-related utility methods
     * Used for custom authorization checks in PreAuthorize annotations
     */
    public static class SecurityService {
        /**
         * Checks if the given userId matches the currently authenticated user's ID
         * 
         * @param userId The user ID to check against the current authentication
         * @return true if the userId matches the current user's ID, false otherwise
         */
        public boolean isCurrentUser(String userId) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return false;
            }
            
            // The principal is the userId (set in JwtAuthenticationFilter)
            Object principal = authentication.getPrincipal();
            return userId != null && userId.equals(principal);
        }
    }
}



