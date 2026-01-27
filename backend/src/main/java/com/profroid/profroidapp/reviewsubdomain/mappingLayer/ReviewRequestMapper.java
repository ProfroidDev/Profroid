package com.profroid.profroidapp.reviewsubdomain.mappingLayer;

import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.Review;
import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.ReviewStatus;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewRequestModel;
import org.springframework.stereotype.Component;

@Component
public class ReviewRequestMapper {
    
    public Review toEntity(ReviewRequestModel requestModel, String reviewId) {
        if (requestModel == null) {
            return null;
        }
        
        Review review = new Review();
        review.setReviewId(reviewId);
        review.setRating(requestModel.getRating());
        review.setComment(requestModel.getComment());
        review.setCustomerName(requestModel.getCustomerName());
        review.setCustomerId(requestModel.getCustomerId());
        review.setStatus(ReviewStatus.PENDING);
        
        return review;
    }
}
