package com.profroid.profroidapp.appointmentsubdomain.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Utility class to send appointment notifications via the auth-service
 */
@Component
public class AppointmentNotificationUtil {
    
    private static final Logger logger = Logger.getLogger(AppointmentNotificationUtil.class.getName());
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newHttpClient();
    
    private String authServiceUrl;
    
    public AppointmentNotificationUtil() {
        this.authServiceUrl = System.getenv("AUTH_SERVICE_URL");
        if (this.authServiceUrl == null || this.authServiceUrl.isBlank()) {
            // Default fallback
            this.authServiceUrl = "http://auth-service:3001";
        }
        // Remove trailing slash if present
        if (this.authServiceUrl.endsWith("/")) {
            this.authServiceUrl = this.authServiceUrl.substring(0, this.authServiceUrl.length() - 1);
        }
    }
    
    /**
     * Send appointment booked notification
     */
    public void sendAppointmentBookedNotification(List<Map<String, String>> recipients, Map<String, Object> details) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipients", recipients);
            payload.put("details", details);
            
            sendNotification("/api/notifications/appointment/booked", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send appointment booked notification", e);
            // Don't throw exception - notification failure shouldn't block appointment creation
        }
    }
    
    /**
     * Send appointment cancelled notification
     */
    public void sendAppointmentCancelledNotification(List<Map<String, String>> recipients, Map<String, Object> details, String cancellationReason) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipients", recipients);
            payload.put("details", details);
            if (cancellationReason != null && !cancellationReason.isBlank()) {
                payload.put("cancellationReason", cancellationReason);
            }
            
            sendNotification("/api/notifications/appointment/cancelled", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send appointment cancelled notification", e);
            // Don't throw exception - notification failure shouldn't block cancellation
        }
    }
    
    /**
     * Send appointment updated notification
     */
    public void sendAppointmentUpdatedNotification(List<Map<String, String>> recipients, Map<String, Object> details, List<String> changedFields) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipients", recipients);
            payload.put("details", details);
            payload.put("changedFields", changedFields);
            
            sendNotification("/api/notifications/appointment/updated", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send appointment updated notification", e);
            // Don't throw exception - notification failure shouldn't block appointment update
        }
    }
    
    /**
     * Send appointment reminder notification
     */
    public void sendAppointmentReminderNotification(Map<String, String> recipient, Map<String, Object> details, int hoursUntilAppointment) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipient", recipient);
            payload.put("details", details);
            payload.put("hoursUntilAppointment", hoursUntilAppointment);
            
            sendNotification("/api/notifications/appointment/reminder", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send appointment reminder notification", e);
            // Don't throw exception - notification failure shouldn't block reminder
        }
    }
    
    /**
     * Generic method to send notification request
     */
    private void sendNotification(String endpoint, Map<String, Object> payload) throws Exception {
        String url = authServiceUrl + endpoint;
        String jsonPayload = objectMapper.writeValueAsString(payload);
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(java.time.Duration.ofSeconds(10))
                .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            logger.log(Level.WARNING, "Notification endpoint returned status " + response.statusCode() + ": " + response.body());
        }
    }
}
