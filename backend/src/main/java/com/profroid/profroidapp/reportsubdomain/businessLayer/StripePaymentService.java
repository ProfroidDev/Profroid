package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.presentationLayer.CreateCheckoutSessionResponse;

public interface StripePaymentService {
    CreateCheckoutSessionResponse createCheckoutSession(String billId, String userId, String userRole);
    void handleCheckoutSessionCompleted(String stripeSessionId);
}
