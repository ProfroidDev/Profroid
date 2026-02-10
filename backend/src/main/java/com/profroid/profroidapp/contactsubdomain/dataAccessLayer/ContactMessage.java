package com.profroid.profroidapp.contactsubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "contact_messages", indexes = {
    @Index(name = "idx_message_id", columnList = "messageId"),
    @Index(name = "idx_is_read", columnList = "isRead"),
    @Index(name = "idx_ip_address", columnList = "ipAddress"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
@Data
public class ContactMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String messageId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String email;
    
    @Column
    private String phone;
    
    @Column(nullable = false)
    private String subject;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(nullable = false)
    private String ipAddress;
    
    @Column(nullable = false)
    private Boolean isRead = false;
    
    @Column
    private String adminNotes;
    
    @Column
    private String respondedBy; // Admin userId who responded
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
    
    @Column
    private Instant respondedAt; // When admin replied
}
