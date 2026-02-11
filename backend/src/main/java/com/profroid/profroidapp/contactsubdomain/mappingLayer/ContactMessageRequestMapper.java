package com.profroid.profroidapp.contactsubdomain.mappingLayer;

import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.ContactMessage;
import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageRequestModel;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ContactMessageRequestMapper {
    
    public ContactMessage toEntity(ContactMessageRequestModel requestModel, String ipAddress) {
        ContactMessage message = new ContactMessage();
        message.setMessageId(UUID.randomUUID().toString());
        message.setName(requestModel.getName());
        message.setEmail(requestModel.getEmail());
        message.setPhone(requestModel.getPhone());
        message.setSubject(requestModel.getSubject());
        message.setMessage(requestModel.getMessage());
        message.setIpAddress(ipAddress);
        return message;
    }
}
