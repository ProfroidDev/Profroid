package com.profroid.profroidapp.warrantysubdomain.presentationLayer;

import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WarrantyClaimStatusUpdateModel {
    
    @NotNull(message = "Status is required")
    private WarrantyClaimStatus status;
    
    private String adminNotes;
    
    private String resolutionDetails;
}
