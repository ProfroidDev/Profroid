package com.profroid.profroidapp.contactsubdomain.businessLayer;

import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.MessageStatus;
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
     * Get messages by status (admin only)
     */
    Page<ContactMessageResponseModel> getMessagesByStatus(MessageStatus status, Pageable pageable);
    
    /**
     * Get a specific message by ID (admin only)
     */
    ContactMessageResponseModel getMessageById(String messageId);
    
    /**
     * Update message status (admin only)
     */
    ContactMessageResponseModel updateMessageStatus(String messageId, MessageStatus newStatus);
    
    /**
     * Add admin notes to a message (admin only)
     */
    ContactMessageResponseModel addAdminNotes(String messageId, String notes, String adminUserId);
    
    /**
     * Get unread message count (admin only)
     */
    long getUnreadMessageCount();
}
