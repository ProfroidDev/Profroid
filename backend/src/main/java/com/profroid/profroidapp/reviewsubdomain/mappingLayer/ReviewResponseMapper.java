package com.profroid.profroidapp.reviewsubdomain.mappingLayer;

import com.profroid.profroidapp.reviewsubdomain.dataAccessLayer.Review;
import com.profroid.profroidapp.reviewsubdomain.presentationLayer.ReviewResponseModel;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReviewResponseMapper {
    
    public ReviewResponseModel toResponseModel(Review review) {
        if (review == null) {
            return null;
        }
        
        return ReviewResponseModel.builder()
                .reviewId(review.getReviewId())
                .rating(review.getRating())
                .comment(review.getComment())
                .customerName(review.getCustomerName())
                .customerId(review.getCustomerId())
                .status(review.getStatus().name())
                .reviewedBy(review.getReviewedBy())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .reviewedAt(review.getReviewedAt())
                .build();
    }
    
    public List<ReviewResponseModel> toResponseModelList(List<Review> reviews) {
        return reviews.stream()
                .map(this::toResponseModel)
                .collect(Collectors.toList());
    }
}
