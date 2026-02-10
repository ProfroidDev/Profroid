package com.profroid.profroidapp.contactsubdomain.dataAccessLayer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    Optional<ContactMessage> findByMessageId(String messageId);
    Page<ContactMessage> findByStatus(MessageStatus status, Pageable pageable);
    Page<ContactMessage> findAll(Pageable pageable);
    
    /**
     * Find messages from a specific IP address created after a certain time
     * Used for rate limiting
     */
    @Query("SELECT c FROM ContactMessage c WHERE c.ipAddress = :ipAddress AND c.createdAt > :afterTime ORDER BY c.createdAt DESC")
    List<ContactMessage> findRecentMessagesByIp(@Param("ipAddress") String ipAddress, @Param("afterTime") Instant afterTime);
}
