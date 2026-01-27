package com.profroid.profroidapp.reviewsubdomain.dataAccessLayer;

public enum ReviewStatus {
    PENDING,    // Waiting for admin approval
    APPROVED,   // Approved by admin and displayed on home page
    REJECTED    // Rejected by admin
}
