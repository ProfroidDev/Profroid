package com.profroid.profroidapp.warrantysubdomain.presentationLayer;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyClaimRequestModel {
    
    @NotBlank(message = "Customer name is required")
    private String customerName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String customerEmail;
    
    @NotBlank(message = "Phone number is required")
    private String customerPhone;
    
    private String customerAddress;
    
    @NotBlank(message = "Product name is required")
    private String productName;
    
    private String productSerialNumber;
    
    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;
    
    @NotBlank(message = "Issue description is required")
    private String issueDescription;
    
    private String preferredContactMethod;
}
