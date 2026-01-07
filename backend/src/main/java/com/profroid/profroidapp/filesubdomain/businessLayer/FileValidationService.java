package com.profroid.profroidapp.filesubdomain.businessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileValidationService {

    // Default 10MB max, configurable via application properties
    @Value("${file.upload.max-size-bytes:10485760}")
    private long maxFileSizeBytes;

    public void validateUpload(MultipartFile file, FileOwnerType ownerType, String ownerId, FileCategory category) {
        if (ownerType == null) {
            throw new IllegalArgumentException("Owner type is required.");
        }

        if (ownerId == null || ownerId.isBlank()) {
            throw new IllegalArgumentException("Owner id is required.");
        }

        if (category == null) {
            throw new IllegalArgumentException("File category is required.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required.");
        }

        long fileSize = file.getSize();
        if (fileSize > maxFileSizeBytes) {
            long maxSizeMB = maxFileSizeBytes / (1024 * 1024);
            long actualSizeMB = fileSize / (1024 * 1024);
            throw new IllegalArgumentException(
                String.format("File size (%d MB) exceeds maximum allowed size (%d MB).", actualSizeMB, maxSizeMB)
            );
        }

        String ct = file.getContentType();
        if (ct == null || ct.isBlank()) {
            throw new IllegalArgumentException("Content-Type is required.");
        }

        if (category == FileCategory.IMAGE) {
            if (!ct.startsWith("image/")) {
                throw new IllegalArgumentException("Only image/* is allowed for IMAGE.");
            }
        } else if (category == FileCategory.REPORT) {
            if (!ct.equalsIgnoreCase("application/pdf")) {
                throw new IllegalArgumentException("Only application/pdf is allowed for REPORT.");
            }
        }
    }
}
