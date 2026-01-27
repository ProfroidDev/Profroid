package com.profroid.profroidapp.reviewsubdomain.businessLayer;

import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewStatus;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewRequestModel;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewResponseModel;

import java.util.List;

public interface ReviewService {
    
    /**
     * Create a new review (submitted by users)
     */
    ReviewResponseModel createReview(ReviewRequestModel requestModel);
    
    /**
     * Get all reviews (admin only)
     */
    List<ReviewResponseModel> getAllReviews();
    
    /**
     * Get reviews by status
     */
    List<ReviewResponseModel> getReviewsByStatus(ReviewStatus status);
    
    /**
     * Get approved reviews for display on home page (public)
     */
    List<ReviewResponseModel> getApprovedReviews();
    
    /**
     * Get review by ID
     */
    ReviewResponseModel getReviewById(String reviewId);
    
    /**
     * Update review status (approve/reject by admin)
     */
    ReviewResponseModel updateReviewStatus(String reviewId, ReviewStatus status, String reviewedBy);
    
    /**
     * Delete a review (admin only)
     */
    void deleteReview(String reviewId);
}
