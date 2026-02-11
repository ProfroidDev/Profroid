package com.profroid.profroidapp.contactsubdomain.businessLayer;

import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageRequestModel;
import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageResponseModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactMessageService {
    
    /**
     * Create a new contact message
     */
    ContactMessageResponseModel createMessage(ContactMessageRequestModel requestModel, String ipAddress);
    
    /**
     * Get all messages (admin only) with pagination
     */
    Page<ContactMessageResponseModel> getAllMessages(Pageable pageable);
    
    /**
     * Get unread messages (admin only)
     */
    Page<ContactMessageResponseModel> getUnreadMessages(Pageable pageable);
    
    /**
     * Get a specific message by ID (admin only)
     */
    ContactMessageResponseModel getMessageById(String messageId);
    
    /**
     * Update message read status (admin only)
     */
    ContactMessageResponseModel updateMessageReadStatus(String messageId, Boolean isRead);
    
    /**
     * Add admin notes to a message (admin only)
     */
    ContactMessageResponseModel addAdminNotes(String messageId, String notes, String adminUserId);
    
    /**
     * Delete a message (admin only)
     */
    void deleteMessage(String messageId);
    
    /**
     * Get unread message count (admin only)
     */
    long getUnreadMessageCount();
}
