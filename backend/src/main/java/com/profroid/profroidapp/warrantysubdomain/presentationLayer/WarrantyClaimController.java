package com.profroid.profroidapp.warrantysubdomain.presentationLayer;

import com.profroid.profroidapp.warrantysubdomain.businessLayer.WarrantyClaimService;
import com.profroid.profroidapp.warrantysubdomain.dataAccessLayer.WarrantyClaimStatus;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/warranty-claims")
public class WarrantyClaimController {
    
    private static final Logger logger = LoggerFactory.getLogger(WarrantyClaimController.class);
    private final WarrantyClaimService claimService;
    
    public WarrantyClaimController(WarrantyClaimService claimService) {
        this.claimService = claimService;
    }
    
    /**
     * Create a new warranty claim (public endpoint - anyone can submit)
     * Status will be PENDING until admin reviews
     */
    @PostMapping
    public ResponseEntity<WarrantyClaimResponseModel> createClaim(
            @Valid @RequestBody WarrantyClaimRequestModel requestModel) {
        logger.info("Received warranty claim submission from: {}", requestModel.getCustomerEmail());
        WarrantyClaimResponseModel response = claimService.createClaim(requestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get all warranty claims (Admin only)
     * Returns all claims regardless of status
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<WarrantyClaimResponseModel>> getAllClaims() {
        logger.info("Admin fetching all warranty claims");
        List<WarrantyClaimResponseModel> claims = claimService.getAllClaims();
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get claims by status (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<WarrantyClaimResponseModel>> getClaimsByStatus(
            @PathVariable WarrantyClaimStatus status) {
        logger.info("Admin fetching warranty claims with status: {}", status);
        List<WarrantyClaimResponseModel> claims = claimService.getClaimsByStatus(status);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get pending claims (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public ResponseEntity<List<WarrantyClaimResponseModel>> getPendingClaims() {
        logger.info("Admin fetching pending warranty claims");
        List<WarrantyClaimResponseModel> claims = claimService.getClaimsByStatus(WarrantyClaimStatus.PENDING);
        return ResponseEntity.ok(claims);
    }
    
    /**
     * Get claim by ID (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{claimId}")
    public ResponseEntity<WarrantyClaimResponseModel> getClaimById(@PathVariable String claimId) {
        logger.info("Admin fetching warranty claim: {}", claimId);
        WarrantyClaimResponseModel claim = claimService.getClaimById(claimId);
        return ResponseEntity.ok(claim);
    }
    
    /**
     * Update claim status (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{claimId}/status")
    public ResponseEntity<WarrantyClaimResponseModel> updateClaimStatus(
            @PathVariable String claimId,
            @Valid @RequestBody WarrantyClaimStatusUpdateModel updateModel,
            Authentication authentication) {
        
        String adminUserId = authentication.getName();
        logger.info("Admin {} updating warranty claim {} to status: {}", 
                    adminUserId, claimId, updateModel.getStatus());
        
        WarrantyClaimResponseModel response = claimService.updateClaimStatus(
                claimId, updateModel, adminUserId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Assign claim to admin/technician (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{claimId}/assign/{userId}")
    public ResponseEntity<WarrantyClaimResponseModel> assignClaim(
            @PathVariable String claimId,
            @PathVariable String userId) {
        
        logger.info("Assigning warranty claim {} to user: {}", claimId, userId);
        WarrantyClaimResponseModel response = claimService.assignClaim(claimId, userId);
        return ResponseEntity.ok(response);
    }
}
