package com.profroid.profroidapp.reviewsubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    Optional<Review> findByReviewId(String reviewId);
    
    List<Review> findByStatus(ReviewStatus status);
    
    List<Review> findByStatusOrderByCreatedAtDesc(ReviewStatus status);
    
    List<Review> findAllByOrderByCreatedAtDesc();
}
