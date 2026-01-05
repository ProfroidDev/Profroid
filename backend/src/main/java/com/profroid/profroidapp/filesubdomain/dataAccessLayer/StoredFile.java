package com.profroid.profroidapp.filesubdomain.dataAccessLayer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "files")
@Setter
@Getter
public class StoredFile {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String bucket;

    @Column(nullable = false, unique = true)
    private String objectKey;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String ownerType; // enum name

    @Column(nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String category; // enum name

    @Column(nullable = false)
    private Instant createdAt;

    private Instant deletedAt;
}
