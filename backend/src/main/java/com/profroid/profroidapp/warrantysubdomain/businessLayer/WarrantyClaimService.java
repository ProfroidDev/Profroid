package com.profroid.profroidapp.warrantysubdomain.businessLayer;

import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimStatus;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimRequestModel;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimResponseModel;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimStatusUpdateModel;

import java.util.List;

public interface WarrantyClaimService {
    
    WarrantyClaimResponseModel createClaim(WarrantyClaimRequestModel requestModel);
    
    List<WarrantyClaimResponseModel> getAllClaims();
    
    List<WarrantyClaimResponseModel> getClaimsByStatus(WarrantyClaimStatus status);
    
    WarrantyClaimResponseModel getClaimById(String claimId);
    
    WarrantyClaimResponseModel updateClaimStatus(
        String claimId, 
        WarrantyClaimStatusUpdateModel updateModel, 
        String adminUserId
    );
    
    WarrantyClaimResponseModel assignClaim(String claimId, String assignedTo);
}
