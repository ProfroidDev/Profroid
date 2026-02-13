package com.profroid.profroidapp.warrantysubdomain.mappingLayer;

import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaim;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimResponseModel;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WarrantyClaimResponseMapper {
    
    public WarrantyClaimResponseModel entityToResponseModel(WarrantyClaim claim) {
        return WarrantyClaimResponseModel.builder()
                .claimId(claim.getClaimId())
                .customerName(claim.getCustomerName())
                .customerEmail(claim.getCustomerEmail())
                .customerPhone(claim.getCustomerPhone())
                .customerAddress(claim.getCustomerAddress())
                .productName(claim.getProductName())
                .productSerialNumber(claim.getProductSerialNumber())
                .purchaseDate(claim.getPurchaseDate())
                .issueDescription(claim.getIssueDescription())
                .preferredContactMethod(claim.getPreferredContactMethod())
                .status(claim.getStatus())
                .assignedTo(claim.getAssignedTo())
                .adminNotes(claim.getAdminNotes())
                .resolutionDetails(claim.getResolutionDetails())
                .reviewedBy(claim.getReviewedBy())
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .reviewedAt(claim.getReviewedAt())
                .resolvedAt(claim.getResolvedAt())
                .build();
    }
    
    public List<WarrantyClaimResponseModel> entityListToResponseModelList(List<WarrantyClaim> claims) {
        return claims.stream()
                .map(this::entityToResponseModel)
                .collect(Collectors.toList());
    }
}
