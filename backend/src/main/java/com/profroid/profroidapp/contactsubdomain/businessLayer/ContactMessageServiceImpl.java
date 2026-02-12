package com.profroid.profroidapp.contactsubdomain.businessLayer;

import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.ContactMessage;
import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.ContactMessageRepository;
import com.profroid.profroidapp.contactsubdomain.mappingLayer.ContactMessageRequestMapper;
import com.profroid.profroidapp.contactsubdomain.mappingLayer.ContactMessageResponseMapper;
import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageRequestModel;
import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageResponseModel;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ContactMessageServiceImpl implements ContactMessageService {
    
    private static final Logger log = LoggerFactory.getLogger(ContactMessageServiceImpl.class);
    private static final int MAX_MESSAGES_PER_IP = 5;
    private static final long RATE_LIMIT_WINDOW_MINUTES = 20;
    
    private final ContactMessageRepository contactMessageRepository;
    private final ContactMessageRequestMapper requestMapper;
    private final ContactMessageResponseMapper responseMapper;
    
    public ContactMessageServiceImpl(
            ContactMessageRepository contactMessageRepository,
            ContactMessageRequestMapper requestMapper,
            ContactMessageResponseMapper responseMapper) {
        this.contactMessageRepository = contactMessageRepository;
        this.requestMapper = requestMapper;
        this.responseMapper = responseMapper;
    }
    
    @Override
    @Transactional
    public ContactMessageResponseModel createMessage(ContactMessageRequestModel requestModel, String ipAddress) {
        log.info("Creating new contact message from IP: {} email: {}", ipAddress, requestModel.getEmail());
        
        // Check rate limit
        checkRateLimit(ipAddress);
        
        ContactMessage message = requestMapper.toEntity(requestModel, ipAddress);
        message.setIsRead(false);
        
        ContactMessage savedMessage = contactMessageRepository.save(message);
        log.info("Contact message created with ID: {} from IP: {}", savedMessage.getMessageId(), ipAddress);
        
        return responseMapper.toResponseModel(savedMessage);
    }
    
    @Override
    public Page<ContactMessageResponseModel> getAllMessages(Pageable pageable) {
        log.info("Fetching all contact messages");
        Page<ContactMessage> messages = contactMessageRepository.findAll(pageable);
        return messages.map(responseMapper::toResponseModel);
    }
    
    @Override
    public Page<ContactMessageResponseModel> getUnreadMessages(Pageable pageable) {
        log.info("Fetching unread contact messages");
        Page<ContactMessage> messages = contactMessageRepository.findByIsRead(false, pageable);
        return messages.map(responseMapper::toResponseModel);
    }
    
    @Override
    public ContactMessageResponseModel getMessageById(String messageId) {
        log.info("Fetching contact message: {}", messageId);
        ContactMessage message = contactMessageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found: " + messageId));
        
        // Don't automatically change status - let admin control it via the dropdown
        
        return responseMapper.toResponseModel(message);
    }
    
    @Override
    @Transactional
    public ContactMessageResponseModel updateMessageReadStatus(String messageId, Boolean isRead) {
        log.info("Updating message {} isRead to: {}", messageId, isRead);
        ContactMessage message = contactMessageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found: " + messageId));
        
        message.setIsRead(isRead);
        ContactMessage updatedMessage = contactMessageRepository.save(message);
        
        return responseMapper.toResponseModel(updatedMessage);
    }
    
    @Override
    @Transactional
    public ContactMessageResponseModel addAdminNotes(String messageId, String notes, String adminUserId) {
        log.info("Admin {} adding notes to message {}", adminUserId, messageId);
        ContactMessage message = contactMessageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found: " + messageId));
        
        message.setAdminNotes(notes);
        message.setRespondedBy(adminUserId);
        message.setRespondedAt(Instant.now());
        // Don't force status to RESOLVED - let admin control the status separately
        
        ContactMessage updatedMessage = contactMessageRepository.save(message);
        return responseMapper.toResponseModel(updatedMessage);
    }
    
    @Override
    public long getUnreadMessageCount() {
        return contactMessageRepository.countByIsRead(false);
    }
    
    @Override
    @Transactional
    public void deleteMessage(String messageId) {
        log.info("Deleting contact message: {}", messageId);
        ContactMessage message = contactMessageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message not found: " + messageId));
        
        contactMessageRepository.delete(message);
        log.info("Contact message deleted: {}", messageId);
    }

    /**
     * Check if IP address has exceeded rate limit
     * Max 5 messages per 20 minutes per IP
     */
    private void checkRateLimit(String ipAddress) {
        Instant windowStart = Instant.now().minusSeconds(RATE_LIMIT_WINDOW_MINUTES * 60);
        List<ContactMessage> recentMessages = contactMessageRepository.findRecentMessagesByIp(ipAddress, windowStart);
        
        if (recentMessages.size() >= MAX_MESSAGES_PER_IP) {
            log.warn("Rate limit exceeded for IP: {}. {} messages in last {} minutes",
                    ipAddress, recentMessages.size(), RATE_LIMIT_WINDOW_MINUTES);
            throw new RateLimitExceededException(
                    "Too many messages. Maximum " + MAX_MESSAGES_PER_IP + 
                    " messages allowed per " + RATE_LIMIT_WINDOW_MINUTES + " minutes. Please try again later.");
        }
    }
}
