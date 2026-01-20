package com.profroid.profroidapp.auth;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;

/**
 * REST Controller for authentication endpoints
 * Proxies requests to the Auth Service
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServiceClient authServiceClient;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authServiceClient.register(request.getEmail(), request.getPassword(), request.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Registration failed"));
        }
    }

    /**
     * Sign in user
     * POST /api/auth/sign-in
     */
    @PostMapping("/sign-in")
    public ResponseEntity<?> signIn(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authServiceClient.signIn(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Sign in failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Sign in failed"));
        }
    }

    /**
     * Get current user
     * GET /api/auth/user
     * Headers: Authorization: Bearer <sessionId>
     */
    @GetMapping("/user")
    public ResponseEntity<?> getUser(@RequestHeader("Authorization") String authorization) {
        try {
            String sessionId = authorization.replace("Bearer ", "");
            UserResponse response = authServiceClient.getUser(sessionId);
            if (response != null) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid session"));
        } catch (Exception e) {
            log.error("Failed to get user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get user"));
        }
    }

    /**
     * Update user profile
     * PUT /api/auth/user
     */
    @PutMapping("/user")
    public ResponseEntity<?> updateUser(
        @RequestHeader("Authorization") String authorization,
        @RequestBody Map<String, String> updates) {
        try {
            String sessionId = authorization.replace("Bearer ", "");
            UserResponse response = authServiceClient.updateUser(sessionId, updates);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update user"));
        }
    }

    /**
     * Change password
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
        @RequestHeader("Authorization") String authorization,
        @RequestBody ChangePasswordRequest request) {
        try {
            String sessionId = authorization.replace("Bearer ", "");
            Map<String, Object> response = authServiceClient.changePassword(
                sessionId, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to change password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to change password"));
        }
    }

    /**
     * Sign out
     * POST /api/auth/sign-out
     */
    @PostMapping("/sign-out")
    public ResponseEntity<?> signOut(@RequestHeader("Authorization") String authorization) {
        try {
            String sessionId = authorization.replace("Bearer ", "");
            boolean success = authServiceClient.signOut(sessionId);
            if (success) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Signed out successfully"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Sign out failed"));
        } catch (Exception e) {
            log.error("Sign out failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Sign out failed"));
        }
    }

    /**
     * Health check
     * GET /api/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean isHealthy = authServiceClient.healthCheck();
        if (isHealthy) {
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Auth service is running"));
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("status", "error", "message", "Auth service is unavailable"));
    }
}
