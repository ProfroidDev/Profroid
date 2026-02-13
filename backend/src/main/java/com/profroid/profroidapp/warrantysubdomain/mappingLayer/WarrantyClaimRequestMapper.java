package com.profroid.profroidapp.warrantysubdomain.mappingLayer;

import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaim;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimRequestModel;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WarrantyClaimRequestMapper {
    
    public WarrantyClaim requestModelToEntity(WarrantyClaimRequestModel requestModel) {
        WarrantyClaim claim = new WarrantyClaim();
        claim.setClaimId(UUID.randomUUID().toString());
        claim.setCustomerName(requestModel.getCustomerName());
        claim.setCustomerEmail(requestModel.getCustomerEmail());
        claim.setCustomerPhone(requestModel.getCustomerPhone());
        claim.setCustomerAddress(requestModel.getCustomerAddress());
        claim.setProductName(requestModel.getProductName());
        claim.setProductSerialNumber(requestModel.getProductSerialNumber());
        claim.setPurchaseDate(requestModel.getPurchaseDate());
        claim.setIssueDescription(requestModel.getIssueDescription());
        claim.setPreferredContactMethod(requestModel.getPreferredContactMethod());
        return claim;
    }
}
