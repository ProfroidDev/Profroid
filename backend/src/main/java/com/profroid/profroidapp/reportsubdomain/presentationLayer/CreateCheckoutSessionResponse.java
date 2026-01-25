package com.profroid.profroidapp.reportsubdomain.presentationLayer;

public class CreateCheckoutSessionResponse {
    private final String url;
    private final String sessionId;

    public CreateCheckoutSessionResponse(String url, String sessionId) {
        this.url = url;
        this.sessionId = sessionId;
    }

    public String getUrl() {
        return url;
    }

    public String getSessionId() {
        return sessionId;
    }
}
