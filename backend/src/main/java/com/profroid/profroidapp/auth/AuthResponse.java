package com.profroid.profroidapp.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response from auth service register/signin endpoints
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AuthResponse {
    private boolean success;
    private SessionData session;
    private UserData user;
    private String error;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SessionData {
        private String id;
        private String userId;
        private String expires;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserData {
        private String id;
        private String email;
        private String name;
        private String image;
        private boolean emailVerified;
        private String role;
        private boolean isActive;
    }
}
