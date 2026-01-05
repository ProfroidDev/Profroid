package com.profroid.profroidapp.filesubdomain.presentationLayer;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class FileResponseModel {
    private String fileId;
    private String ownerType;
    private String ownerId;
    private String category;
    private String originalFilename;
    private String contentType;
    private long sizeBytes;
    private Instant createdAt;
}
