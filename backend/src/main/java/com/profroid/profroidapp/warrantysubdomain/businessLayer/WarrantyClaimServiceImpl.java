package com.profroid.profroidapp.warrantysubdomain.businessLayer;

import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaim;
import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimRepository;
import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimStatus;
import com.profroid.profroidapp.warrantysubdomain.mappingLayer.WarrantyClaimRequestMapper;
import com.profroid.profroidapp.warrantysubdomain.mappingLayer.WarrantyClaimResponseMapper;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimRequestModel;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimResponseModel;
import com.profroid.profroidapp.warrantysubdomain.presentationLayer.WarrantyClaimStatusUpdateModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class WarrantyClaimServiceImpl implements WarrantyClaimService {
    
    private static final Logger logger = LoggerFactory.getLogger(WarrantyClaimServiceImpl.class);
    
    private final WarrantyClaimRepository claimRepository;
    private final WarrantyClaimRequestMapper requestMapper;
    private final WarrantyClaimResponseMapper responseMapper;
    
    public WarrantyClaimServiceImpl(
            WarrantyClaimRepository claimRepository,
            WarrantyClaimRequestMapper requestMapper,
            WarrantyClaimResponseMapper responseMapper) {
        this.claimRepository = claimRepository;
        this.requestMapper = requestMapper;
        this.responseMapper = responseMapper;
    }
    
    @Override
    @Transactional
    public WarrantyClaimResponseModel createClaim(WarrantyClaimRequestModel requestModel) {
        logger.info("Creating new warranty claim for customer: {}", requestModel.getCustomerEmail());
        
        WarrantyClaim claim = requestMapper.requestModelToEntity(requestModel);
        claim.setStatus(WarrantyClaimStatus.PENDING);
        
        WarrantyClaim savedClaim = claimRepository.save(claim);
        logger.info("Warranty claim created with ID: {}", savedClaim.getClaimId());
        
        return responseMapper.entityToResponseModel(savedClaim);
    }
    
    @Override
    public List<WarrantyClaimResponseModel> getAllClaims() {
        logger.info("Fetching all warranty claims");
        List<WarrantyClaim> claims = claimRepository.findAllByOrderByCreatedAtDesc();
        return responseMapper.entityListToResponseModelList(claims);
    }
    
    @Override
    public List<WarrantyClaimResponseModel> getClaimsByStatus(WarrantyClaimStatus status) {
        logger.info("Fetching warranty claims with status: {}", status);
        List<WarrantyClaim> claims = claimRepository.findByStatusOrderByCreatedAtDesc(status);
        return responseMapper.entityListToResponseModelList(claims);
    }
    
    @Override
    public WarrantyClaimResponseModel getClaimById(String claimId) {
        logger.info("Fetching warranty claim: {}", claimId);
        WarrantyClaim claim = claimRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim not found: " + claimId));
        return responseMapper.entityToResponseModel(claim);
    }
    
    @Override
    @Transactional
    public WarrantyClaimResponseModel updateClaimStatus(
            String claimId,
            WarrantyClaimStatusUpdateModel updateModel,
            String adminUserId) {
        
        logger.info("Updating warranty claim {} status to: {}", claimId, updateModel.getStatus());
        
        WarrantyClaim claim = claimRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim not found: " + claimId));
        
        WarrantyClaimStatus oldStatus = claim.getStatus();
        claim.setStatus(updateModel.getStatus());
        claim.setReviewedBy(adminUserId);
        
        if (updateModel.getAdminNotes() != null) {
            claim.setAdminNotes(updateModel.getAdminNotes());
        }
        
        if (updateModel.getResolutionDetails() != null) {
            claim.setResolutionDetails(updateModel.getResolutionDetails());
        }
        
        // Set timestamps based on status change
        if (oldStatus == WarrantyClaimStatus.PENDING) {
            claim.setReviewedAt(Instant.now());
        }
        
        if (updateModel.getStatus() == WarrantyClaimStatus.RESOLVED) {
            claim.setResolvedAt(Instant.now());
        }
        
        WarrantyClaim updatedClaim = claimRepository.save(claim);
        logger.info("Warranty claim {} updated successfully", claimId);
        
        return responseMapper.entityToResponseModel(updatedClaim);
    }
    
    @Override
    @Transactional
    public WarrantyClaimResponseModel assignClaim(String claimId, String assignedTo) {
        logger.info("Assigning warranty claim {} to: {}", claimId, assignedTo);
        
        WarrantyClaim claim = claimRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty claim not found: " + claimId));
        
        claim.setAssignedTo(assignedTo);
        
        // Auto-update status to IN_REVIEW if currently PENDING
        if (claim.getStatus() == WarrantyClaimStatus.PENDING) {
            claim.setStatus(WarrantyClaimStatus.IN_REVIEW);
            claim.setReviewedAt(Instant.now());
        }
        
        WarrantyClaim updatedClaim = claimRepository.save(claim);
        logger.info("Warranty claim {} assigned successfully", claimId);
        
        return responseMapper.entityToResponseModel(updatedClaim);
    }
}
