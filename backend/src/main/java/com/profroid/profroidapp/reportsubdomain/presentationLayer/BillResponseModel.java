package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BillResponseModel {
    
    private String billId;
    
    // Report information
    private String reportId;
    private Integer reportInternalId;
    
    // Appointment information
    private String appointmentId;
    private String appointmentDate;
    
    // Customer information
    private String customerId;
    private String customerFirstName;
    private String customerLastName;
    private String customerEmail;
    
    // Job information
    private String jobName;
    private String jobNameFr;
    
    // Bill details
    private BigDecimal amount;
    private String status; // UNPAID or PAID
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
}
