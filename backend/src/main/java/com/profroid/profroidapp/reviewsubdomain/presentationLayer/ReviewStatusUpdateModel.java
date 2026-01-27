package com.profroid.profroidapp.reviewsubdomain.presentationLayer;

import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatusUpdateModel {
    
    @NotNull(message = "Status is required")
    private ReviewStatus status;
    
    private String reviewedBy; // Admin userId
}
