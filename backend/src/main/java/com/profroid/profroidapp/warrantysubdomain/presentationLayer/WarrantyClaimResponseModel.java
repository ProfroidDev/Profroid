package com.profroid.profroidapp.warrantysubdomain.presentationLayer;

import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyClaimResponseModel {
    
    private String claimId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerAddress;
    private String productName;
    private String productSerialNumber;
    private LocalDate purchaseDate;
    private String issueDescription;
    private String preferredContactMethod;
    private WarrantyClaimStatus status;
    private String assignedTo;
    private String adminNotes;
    private String resolutionDetails;
    private String reviewedBy;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant reviewedAt;
    private Instant resolvedAt;
}
