package com.profroid.profroidapp.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

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
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()  // Auth endpoints public
                        .requestMatchers("POST", "/api/v1/customers").permitAll()  // Customer creation from auth service
                        .requestMatchers("GET", "/api/v1/jobs").permitAll() // Jobs list is public
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/**").permitAll() // allow file downloads for images
                        .requestMatchers(HttpMethod.GET, "/api/v1/parts/export/pdf").permitAll() // allow PDF export
                        .requestMatchers(HttpMethod.GET, "/api/v1/reports/*/pdf").permitAll() // allow report PDF download
                        // All cellar endpoints require authentication; fine-grained roles enforced via @PreAuthorize
                        .anyRequest().authenticated()  // All other APIs require authentication
                )
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}


