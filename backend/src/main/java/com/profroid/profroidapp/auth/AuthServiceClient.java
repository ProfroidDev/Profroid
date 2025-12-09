package com.profroid.profroidapp.auth;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * Client for communicating with the Auth Service (Node.js/Express)
 */
@Slf4j
@Service
public class AuthServiceClient {

    @Value("${auth.service.url:http://localhost:3001}")
    private String authServiceUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Register a new user
     */
    public AuthResponse register(String email, String password, String name) throws IOException, InterruptedException {
        Map<String, Object> body = Map.of(
            "email", email,
            "password", password,
            "name", name != null ? name : ""
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/register"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return objectMapper.readValue(response.body(), AuthResponse.class);
    }

    /**
     * Sign in user and get session
     */
    public AuthResponse signIn(String email, String password) throws IOException, InterruptedException {
        Map<String, String> body = Map.of(
            "email", email,
            "password", password
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/sign-in"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return objectMapper.readValue(response.body(), AuthResponse.class);
    }

    /**
     * Get current user details
     */
    public UserResponse getUser(String sessionId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/user"))
            .header("Authorization", "Bearer " + sessionId)
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            return objectMapper.readValue(response.body(), UserResponse.class);
        }
        return null;
    }

    /**
     * Update user profile
     */
    public UserResponse updateUser(String sessionId, Map<String, String> updates) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/user"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + sessionId)
            .PUT(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(updates)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return objectMapper.readValue(response.body(), UserResponse.class);
    }

    /**
     * Change password
     */
    public Map<String, Object> changePassword(String sessionId, String oldPassword, String newPassword) throws IOException, InterruptedException {
        Map<String, String> body = Map.of(
            "oldPassword", oldPassword,
            "newPassword", newPassword
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/change-password"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + sessionId)
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            return objectMapper.readValue(response.body(), Map.class);
        }
        return null;
    }

    /**
     * Sign out user
     */
    public boolean signOut(String sessionId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(authServiceUrl + "/api/auth/sign-out"))
            .header("Authorization", "Bearer " + sessionId)
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200;
    }

    /**
     * Verify auth service is running
     */
    public boolean healthCheck() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(authServiceUrl + "/api/auth/health"))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.error("Auth service health check failed", e);
            return false;
        }
    }
}
