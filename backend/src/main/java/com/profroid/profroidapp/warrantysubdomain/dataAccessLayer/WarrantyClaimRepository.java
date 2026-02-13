package com.profroid.profroidapp.warrantysubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, Long> {
    
    Optional<WarrantyClaim> findByClaimId(String claimId);
    
    List<WarrantyClaim> findByStatus(WarrantyClaimStatus status);
    
    List<WarrantyClaim> findByCustomerEmail(String customerEmail);
    
    List<WarrantyClaim> findAllByOrderByCreatedAtDesc();
    
    List<WarrantyClaim> findByStatusOrderByCreatedAtDesc(WarrantyClaimStatus status);
}
