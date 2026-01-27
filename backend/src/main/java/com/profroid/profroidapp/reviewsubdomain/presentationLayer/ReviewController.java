package com.profroid.profroidapp.reviewsubdomain.presentationLayer;

import com.profroid.profroidapp.reviewsubdomain.businessLayer.ReviewService;
import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewStatus;
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
@RequestMapping("/v1/reviews")
public class ReviewController {
    
    private static final Logger logger = LoggerFactory.getLogger(ReviewController.class);
    private final ReviewService reviewService;
    
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }
    
    /**
     * Create a new review (public endpoint - anyone can submit)
     * Status will be PENDING until admin approves
     */
    @PostMapping
    public ResponseEntity<ReviewResponseModel> createReview(
            @Valid @RequestBody ReviewRequestModel requestModel) {
        logger.info("Received review submission from: {}", requestModel.getCustomerName());
        ReviewResponseModel response = reviewService.createReview(requestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get all reviews (Admin only)
     * Returns all reviews regardless of status
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ReviewResponseModel>> getAllReviews() {
        logger.info("Admin fetching all reviews");
        List<ReviewResponseModel> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * Get pending reviews (Admin only)
     * Returns only reviews awaiting approval
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public ResponseEntity<List<ReviewResponseModel>> getPendingReviews() {
        logger.info("Admin fetching pending reviews");
        List<ReviewResponseModel> reviews = reviewService.getReviewsByStatus(ReviewStatus.PENDING);
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * Get approved reviews (Public endpoint)
     * Used to display reviews on the home page
     */
    @GetMapping("/approved")
    public ResponseEntity<List<ReviewResponseModel>> getApprovedReviews() {
        logger.info("Fetching approved reviews for public display");
        List<ReviewResponseModel> reviews = reviewService.getApprovedReviews();
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * Get review by ID (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseModel> getReviewById(@PathVariable String reviewId) {
        logger.info("Admin fetching review: {}", reviewId);
        ReviewResponseModel review = reviewService.getReviewById(reviewId);
        return ResponseEntity.ok(review);
    }
    
    /**
     * Update review status (Admin only)
     * Approve or reject a review
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{reviewId}/status")
    public ResponseEntity<ReviewResponseModel> updateReviewStatus(
            @PathVariable String reviewId,
            @Valid @RequestBody ReviewStatusUpdateModel updateModel,
            Authentication authentication) {
        
        String adminUserId = authentication.getName();
        logger.info("Admin {} updating review {} to status: {}", 
                    adminUserId, reviewId, updateModel.getStatus());
        
        ReviewResponseModel response = reviewService.updateReviewStatus(
                reviewId, 
                updateModel.getStatus(), 
                adminUserId
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a review (Admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable String reviewId) {
        logger.info("Admin deleting review: {}", reviewId);
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}
