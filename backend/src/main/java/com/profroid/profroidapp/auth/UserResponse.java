package com.profroid.profroidapp.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

/**
 * User response from auth service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponse {
    private boolean success;
    private UserData user;
    private String error;

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
        private LocalDateTime createdAt;
        private String role;
        private boolean isActive;
        private String phone;
        private String address;
        private String postalCode;
        private String city;
        private String province;
        private String country;
    }
}
