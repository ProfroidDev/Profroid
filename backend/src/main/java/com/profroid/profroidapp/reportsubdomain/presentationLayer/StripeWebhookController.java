package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.StripePaymentService;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/payments")
public class StripeWebhookController {

    private final StripePaymentService stripePaymentService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    public StripeWebhookController(StripePaymentService stripePaymentService) {
        this.stripePaymentService = stripePaymentService;
    }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public String webhook(@RequestBody String payload,
                          @RequestHeader("Stripe-Signature") String sigHeader) throws Exception {

        Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow();

            stripePaymentService.handleCheckoutSessionCompleted(session.getId());
        }

        return "ok";
    }
}
