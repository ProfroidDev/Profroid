package com.profroid.profroidapp.reportsubdomain.utils;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class PaymentNotificationPayloadBuilder {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("MMMM d, yyyy HH:mm");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getCurrencyInstance(Locale.CANADA);

    public static Map<String, Object> buildPaymentDetails(Bill bill) {
        Map<String, Object> details = new HashMap<>();

        details.put("billId", bill.getBillId());
        details.put("status", bill.getStatus().toString());
        details.put("amount", CURRENCY_FORMATTER.format(bill.getAmount()));

        if (bill.getPaidAt() != null) {
            details.put("paidAt", bill.getPaidAt().format(DATE_TIME_FORMATTER));
        }

        if (bill.getReport() != null && bill.getReport().getReportIdentifier() != null) {
            details.put("reportId", bill.getReport().getReportIdentifier().getReportId());
            details.put("reportInternalId", bill.getReport().getId());
        }

        if (bill.getAppointment() != null && bill.getAppointment().getAppointmentIdentifier() != null) {
            details.put("appointmentId", bill.getAppointment().getAppointmentIdentifier().getAppointmentId());
            LocalDateTime appointmentDate = bill.getAppointment().getAppointmentDate();
            if (appointmentDate != null) {
                details.put("appointmentDate", appointmentDate.format(DATE_TIME_FORMATTER));
            }
            if (bill.getAppointment().getJob() != null) {
                details.put("jobName", bill.getAppointment().getJob().getJobName());
            }
        }

        if (bill.getCustomer() != null) {
            details.put("customerName", formatPersonName(bill.getCustomer().getFirstName(), bill.getCustomer().getLastName()));
            if (bill.getCustomer().getCustomerIdentifier() != null) {
                details.put("customerId", bill.getCustomer().getCustomerIdentifier().getCustomerId());
            }
        }

        if (bill.getStripePaymentIntentId() != null) {
            details.put("paymentIntentId", bill.getStripePaymentIntentId());
        }

        if (bill.getStripeCheckoutSessionId() != null) {
            details.put("stripeSessionId", bill.getStripeCheckoutSessionId());
        }

        return details;
    }

    public static Map<String, String> buildCustomerRecipient(Bill bill) {
        Map<String, String> recipient = new HashMap<>();
        if (bill.getCustomer() != null) {
            recipient.put("userId", bill.getCustomer().getUserId());
            recipient.put("name", formatPersonName(bill.getCustomer().getFirstName(), bill.getCustomer().getLastName()));
        }
        recipient.put("role", "customer");
        return recipient;
    }

    private static String formatPersonName(String firstName, String lastName) {
        String name = "";
        if (firstName != null && !firstName.trim().isEmpty()) {
            name = firstName.trim();
        }
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (!name.isEmpty()) {
                name += " " + lastName.trim();
            } else {
                name = lastName.trim();
            }
        }
        return name.isEmpty() ? "Customer" : name;
    }
}
