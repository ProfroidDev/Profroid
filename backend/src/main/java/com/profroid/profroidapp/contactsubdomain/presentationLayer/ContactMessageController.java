package com.profroid.profroidapp.contactsubdomain.presentationLayer;

import com.profroid.profroidapp.contactsubdomain.businessLayer.ContactMessageService;
import com.profroid.profroidapp.contactsubdomain.businessLayer.RateLimitExceededException;
import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.MessageStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/v1/contact")
public class ContactMessageController {
    
    private static final Logger log = LoggerFactory.getLogger(ContactMessageController.class);
    private final ContactMessageService contactMessageService;
    
    public ContactMessageController(ContactMessageService contactMessageService) {
        this.contactMessageService = contactMessageService;
    }
    
    /**
     * Extract client IP address from HTTP request
     * Handles X-Forwarded-For header for proxied requests
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Create a new contact message (public endpoint)
     * POST /api/v1/contact/messages
     * Rate limited: max 5 messages per IP per 20 minutes
     */
    @PostMapping("/messages")
    public ResponseEntity<?> createMessage(
            @Valid @RequestBody ContactMessageRequestModel requestModel,
            HttpServletRequest request) {
        try {
            String ipAddress = getClientIpAddress(request);
            log.info("Received contact message from IP: {} email: {}", ipAddress, requestModel.getEmail());
            
            ContactMessageResponseModel response = contactMessageService.createMessage(requestModel, ipAddress);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RateLimitExceededException e) {
            log.warn("Rate limit exceeded: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        } catch (Exception e) {
            log.error("Error creating contact message", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create message");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all contact messages (admin only)
     * GET /api/v1/contact/messages?page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/messages")
    public ResponseEntity<Page<ContactMessageResponseModel>> getAllMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Admin fetching all contact messages");
        Pageable pageable = PageRequest.of(page, size);
        Page<ContactMessageResponseModel> messages = contactMessageService.getAllMessages(pageable);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Get contact messages by status (admin only)
     * GET /api/v1/contact/messages/status/UNREAD?page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/messages/status/{status}")
    public ResponseEntity<?> getMessagesByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Admin fetching messages with status: {}", status);
        try {
            MessageStatus messageStatus = MessageStatus.valueOf(status.toUpperCase());
            Pageable pageable = PageRequest.of(page, size);
            Page<ContactMessageResponseModel> messages = contactMessageService.getMessagesByStatus(messageStatus, pageable);
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid status");
            errorResponse.put("message", "Status must be one of: UNREAD, READ, IN_PROGRESS, RESOLVED, ARCHIVED");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Get a specific message (admin only)
     * GET /api/v1/contact/messages/{messageId}
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/messages/{messageId}")
    public ResponseEntity<ContactMessageResponseModel> getMessage(
            @PathVariable String messageId) {
        log.info("Admin fetching message: {}", messageId);
        ContactMessageResponseModel message = contactMessageService.getMessageById(messageId);
        return ResponseEntity.ok(message);
    }
    
    /**
     * Update message status (admin only)
     * PATCH /api/v1/contact/messages/{messageId}/status
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/messages/{messageId}/status")
    public ResponseEntity<?> updateMessageStatus(
            @PathVariable String messageId,
            @RequestParam String status) {
        log.info("Admin updating message {} status to: {}", messageId, status);
        try {
            MessageStatus messageStatus = MessageStatus.valueOf(status.toUpperCase());
            ContactMessageResponseModel updated = contactMessageService.updateMessageStatus(messageId, messageStatus);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid status");
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Add admin notes to a message (admin only)
     * POST /api/v1/contact/messages/{messageId}/notes
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/messages/{messageId}/notes")
    public ResponseEntity<ContactMessageResponseModel> addAdminNotes(
            @PathVariable String messageId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        log.info("Admin adding notes to message: {}", messageId);
        String notes = body.get("notes");
        String adminUserId = authentication.getName();
        ContactMessageResponseModel updated = contactMessageService.addAdminNotes(messageId, notes, adminUserId);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Get unread message count (admin only)
     * GET /api/v1/contact/unread-count
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        log.info("Admin fetching unread message count");
        long unreadCount = contactMessageService.getUnreadMessageCount();
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }
}
