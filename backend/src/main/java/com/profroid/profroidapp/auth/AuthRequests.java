package com.profroid.profroidapp.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTOs for authentication
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class RegisterRequest {
    private String email;
    private String password;
    private String name;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class LoginRequest {
    private String email;
    private String password;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ChangePasswordRequest {
    private String oldPassword;
    private String newPassword;
}
