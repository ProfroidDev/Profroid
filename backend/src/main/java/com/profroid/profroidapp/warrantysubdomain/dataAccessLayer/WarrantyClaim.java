package com.profroid.profroidapp.warrantysubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "warranty_claims")
@Data
public class WarrantyClaim {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String claimId;
    
    @Column(nullable = false)
    private String customerName;
    
    @Column(nullable = false)
    private String customerEmail;
    
    @Column(nullable = false)
    private String customerPhone;
    
    @Column
    private String customerAddress;
    
    @Column(nullable = false)
    private String productName;
    
    @Column
    private String productSerialNumber;
    
    @Column(nullable = false)
    private LocalDate purchaseDate;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String issueDescription;
    
    @Column
    private String preferredContactMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarrantyClaimStatus status = WarrantyClaimStatus.PENDING;
    
    @Column
    private String assignedTo;
    
    @Column(columnDefinition = "TEXT")
    private String adminNotes;
    
    @Column(columnDefinition = "TEXT")
    private String resolutionDetails;
    
    @Column
    private String reviewedBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
    
    @Column
    private Instant reviewedAt;
    
    @Column
    private Instant resolvedAt;
}
