package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.CreateCheckoutSessionResponse;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationPayloadBuilder;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationUtil;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class StripePaymentServiceImpl implements StripePaymentService {

    private final BillRepository billRepository;
    private final PaymentNotificationUtil paymentNotificationUtil;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.url}")
    private String appUrl;

    public StripePaymentServiceImpl(BillRepository billRepository,
                                    PaymentNotificationUtil paymentNotificationUtil) {
        this.billRepository = billRepository;
        this.paymentNotificationUtil = paymentNotificationUtil;
    }

    @Override
    @Transactional
    public CreateCheckoutSessionResponse createCheckoutSession(String billId, String userId, String userRole) {
        Stripe.apiKey = stripeSecretKey;

        Bill bill = billRepository.findByBillId(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));

        // customer can only pay their own bill
        if ("CUSTOMER".equals(userRole) && !userId.equals(bill.getCustomer().getUserId())) {
            throw new InvalidOperationException("You do not have permission to pay this bill");
        }

        if (bill.getStatus() == Bill.BillStatus.PAID) {
            throw new InvalidOperationException("Bill is already paid");
        }

        long amountCents = toCents(bill.getAmount());
        if (amountCents <= 0) {
            throw new InvalidOperationException("Bill amount must be greater than 0");
        }

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(appUrl + "/billing/success?billId=" + billId)
                    .setCancelUrl(appUrl + "/billing/cancel?billId=" + billId)
                    .putMetadata("billId", billId)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("cad")
                                                    .setUnitAmount(amountCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Profroid Bill " + billId)
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);

            // store session id for webhook reconciliation
            bill.setStripeCheckoutSessionId(session.getId());
            billRepository.save(bill);

            return new CreateCheckoutSessionResponse(session.getUrl(), session.getId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create Stripe Checkout Session", e);
        }
    }

    @Override
    @Transactional
    public void handleCheckoutSessionCompleted(String stripeSessionId) {
        Bill bill = billRepository.findByStripeCheckoutSessionId(stripeSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found for Stripe session: " + stripeSessionId));

        // idempotent
        if (bill.getStatus() == Bill.BillStatus.PAID) return;

        try {
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.retrieve(stripeSessionId);

            bill.setStripePaymentIntentId(session.getPaymentIntent());
            bill.setStatus(Bill.BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());

            Bill updatedBill = billRepository.save(bill);

            paymentNotificationUtil.sendPaymentPaidNotification(
                    PaymentNotificationPayloadBuilder.buildCustomerRecipient(updatedBill),
                    PaymentNotificationPayloadBuilder.buildPaymentDetails(updatedBill)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to finalize payment", e);
        }
    }

    private long toCents(BigDecimal amount) {
        BigDecimal cents = amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP);
        return cents.longValueExact();
    }
}
