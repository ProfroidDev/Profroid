package com.profroid.profroidapp.reviewsubdomain.presentationLayer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseModel {
    
    private String reviewId;
    private Integer rating;
    private String comment;
    private String customerName;
    private String customerId;
    private String status;
    private String reviewedBy;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant reviewedAt;
}
