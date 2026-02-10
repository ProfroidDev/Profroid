package com.profroid.profroidapp.contactsubdomain.presentationLayer;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContactMessageResponseModel {
    
    private String messageId;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private String status;
    private String adminNotes;
    private String respondedBy;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant respondedAt;
}
