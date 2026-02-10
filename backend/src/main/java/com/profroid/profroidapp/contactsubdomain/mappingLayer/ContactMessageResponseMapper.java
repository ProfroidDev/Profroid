package com.profroid.profroidapp.contactsubdomain.mappingLayer;

import com.profroid.profroidapp.contactsubdomain.dataAccessLayer.ContactMessage;
import com.profroid.profroidapp.contactsubdomain.presentationLayer.ContactMessageResponseModel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ContactMessageResponseMapper {
    
    public ContactMessageResponseModel toResponseModel(ContactMessage message) {
        return ContactMessageResponseModel.builder()
                .messageId(message.getMessageId())
                .name(message.getName())
                .email(message.getEmail())
                .phone(message.getPhone())
                .subject(message.getSubject())
                .message(message.getMessage())
                .status(message.getStatus().toString())
                .adminNotes(message.getAdminNotes())
                .respondedBy(message.getRespondedBy())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .respondedAt(message.getRespondedAt())
                .build();
    }
    
    public List<ContactMessageResponseModel> toResponseModelList(List<ContactMessage> messages) {
        return messages.stream()
                .map(this::toResponseModel)
                .toList();
    }
}
