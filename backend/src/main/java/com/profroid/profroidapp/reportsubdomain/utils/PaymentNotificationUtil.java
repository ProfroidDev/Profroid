package com.profroid.profroidapp.reportsubdomain.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class PaymentNotificationUtil {

    private static final Logger logger = Logger.getLogger(PaymentNotificationUtil.class.getName());
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newHttpClient();

    private String authServiceUrl;

    public PaymentNotificationUtil() {
        this.authServiceUrl = System.getenv("AUTH_SERVICE_URL");
        if (this.authServiceUrl == null || this.authServiceUrl.isBlank()) {
            this.authServiceUrl = "http://auth-service:3001";
        }
        if (this.authServiceUrl.endsWith("/")) {
            this.authServiceUrl = this.authServiceUrl.substring(0, this.authServiceUrl.length() - 1);
        }
    }

    public void sendPaymentPaidNotification(Map<String, String> customerRecipient, Map<String, Object> details) {
        try {
            if (customerRecipient == null || customerRecipient.get("userId") == null) {
                logger.log(Level.WARNING, "Missing customer recipient userId for payment notification");
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("customer", customerRecipient);
            payload.put("details", details);

            sendNotification("/api/notifications/payment/paid", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send payment paid notification", e);
        }
    }

    public void sendPaymentDueNotification(Map<String, String> customerRecipient, Map<String, Object> details) {
        try {
            if (customerRecipient == null || customerRecipient.get("userId") == null) {
                logger.log(Level.WARNING, "Missing customer recipient userId for payment notification");
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("customer", customerRecipient);
            payload.put("details", details);

            sendNotification("/api/notifications/payment/due", payload);
        } catch (Exception e) {
            logger.log(Level.WARNING, "Failed to send payment due notification", e);
        }
    }

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
            logger.log(Level.WARNING, "Payment notification endpoint returned status " + response.statusCode() + ": " + response.body());
        }
    }
}
