package com.profroid.profroidapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler for consistent error responses
 * - 401 Unauthorized: Authentication missing or invalid
 * - 403 Forbidden: Authenticated but lacking permission
 */
@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle 403 Forbidden (Access Denied)
     * User is authenticated but doesn't have required role/permission
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex,
            WebRequest request) {
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "Forbidden");
        body.put("message", "You do not have permission to access this resource");
        body.put("timestamp", LocalDateTime.now());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle 404 Not Found
     * Requested resource does not exist
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            NoHandlerFoundException ex,
            WebRequest request) {
        

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "Not Found");
        body.put("message", "The requested resource does not exist");
        body.put("timestamp", LocalDateTime.now());
        body.put("path", ex.getRequestURL());
        
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Generic exception handler for uncaught exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            WebRequest request) {
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred");
        body.put("timestamp", LocalDateTime.now());
        body.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
