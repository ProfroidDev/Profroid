package com.profroid.profroidapp.reviewsubdomain.businessLayer;

import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.Review;
import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewRepository;
import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewStatus;
import com.profroid.profroidapp.reviewsubdomain.mappingLayer.ReviewRequestMapper;
import com.profroid.profroidapp.reviewsubdomain.mappingLayer.ReviewResponseMapper;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewRequestModel;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewResponseModel;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewServiceImpl implements ReviewService {
    
    private static final Logger logger = LoggerFactory.getLogger(ReviewServiceImpl.class);
    
    private final ReviewRepository reviewRepository;
    private final ReviewRequestMapper reviewRequestMapper;
    private final ReviewResponseMapper reviewResponseMapper;
    
    public ReviewServiceImpl(ReviewRepository reviewRepository,
                            ReviewRequestMapper reviewRequestMapper,
                            ReviewResponseMapper reviewResponseMapper) {
        this.reviewRepository = reviewRepository;
        this.reviewRequestMapper = reviewRequestMapper;
        this.reviewResponseMapper = reviewResponseMapper;
    }
    
    @Override
    @Transactional
    public ReviewResponseModel createReview(ReviewRequestModel requestModel) {
        logger.info("Creating new review from customer: {}", requestModel.getCustomerName());
        
        // Generate unique review ID
        String reviewId = "REV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Map to entity
        Review review = reviewRequestMapper.toEntity(requestModel, reviewId);
        
        // Save to database
        Review savedReview = reviewRepository.save(review);
        
        logger.info("Review created successfully with ID: {}", savedReview.getReviewId());
        
        return reviewResponseMapper.toResponseModel(savedReview);
    }
    
    @Override
    public List<ReviewResponseModel> getAllReviews() {
        logger.info("Fetching all reviews");
        List<Review> reviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        return reviewResponseMapper.toResponseModelList(reviews);
    }
    
    @Override
    public List<ReviewResponseModel> getReviewsByStatus(ReviewStatus status) {
        logger.info("Fetching reviews with status: {}", status);
        List<Review> reviews = reviewRepository.findByStatusOrderByCreatedAtDesc(status);
        return reviewResponseMapper.toResponseModelList(reviews);
    }
    
    @Override
    public List<ReviewResponseModel> getApprovedReviews() {
        logger.info("Fetching approved reviews for public display");
        List<Review> reviews = reviewRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.APPROVED);
        return reviewResponseMapper.toResponseModelList(reviews);
    }
    
    @Override
    public ReviewResponseModel getReviewById(String reviewId) {
        logger.info("Fetching review by ID: {}", reviewId);
        Review review = reviewRepository.findByReviewId(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        return reviewResponseMapper.toResponseModel(review);
    }
    
    @Override
    @Transactional
    public ReviewResponseModel updateReviewStatus(String reviewId, ReviewStatus status, String reviewedBy) {
        logger.info("Updating review {} status to: {} by admin: {}", reviewId, status, reviewedBy);
        
        Review review = reviewRepository.findByReviewId(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        
        review.setStatus(status);
        review.setReviewedBy(reviewedBy);
        review.setReviewedAt(Instant.now());
        
        Review updatedReview = reviewRepository.save(review);
        
        logger.info("Review {} status updated successfully", reviewId);
        
        return reviewResponseMapper.toResponseModel(updatedReview);
    }
    
    @Override
    @Transactional
    public void deleteReview(String reviewId) {
        logger.info("Deleting review: {}", reviewId);
        
        Review review = reviewRepository.findByReviewId(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        
        reviewRepository.delete(review);
        
        logger.info("Review {} deleted successfully", reviewId);
    }
}
