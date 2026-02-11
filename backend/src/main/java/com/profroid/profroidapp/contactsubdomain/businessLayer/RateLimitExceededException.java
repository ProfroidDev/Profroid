package com.profroid.profroidapp.contactsubdomain.businessLayer;

/**
 * Exception thrown when IP-based rate limit is exceeded for contact messages
 */
public class RateLimitExceededException extends RuntimeException {
    
    public RateLimitExceededException(String message) {
        super(message);
    }
    
    public RateLimitExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
