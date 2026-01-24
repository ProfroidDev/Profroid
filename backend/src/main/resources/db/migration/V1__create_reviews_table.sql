-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id VARCHAR(255) NOT NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
);

-- Add comment for documentation
ALTER TABLE reviews COMMENT = 'Stores customer reviews with admin moderation';
