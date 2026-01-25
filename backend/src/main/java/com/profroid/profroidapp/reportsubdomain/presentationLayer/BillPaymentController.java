package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/bills")
public class BillPaymentController {

    private final StripePaymentService stripePaymentService;

    public BillPaymentController(StripePaymentService stripePaymentService) {
        this.stripePaymentService = stripePaymentService;
    }

    @PostMapping("/{billId}/checkout-session")
    public ResponseEntity<CreateCheckoutSessionResponse> createCheckoutSession(
            @PathVariable String billId,
            Authentication authentication
    ) {
        String userId = authentication.getName(); // must match customer.userId
        String userRole = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("CUSTOMER");

        return ResponseEntity.ok(stripePaymentService.createCheckoutSession(billId, userId, userRole));
    }
}
