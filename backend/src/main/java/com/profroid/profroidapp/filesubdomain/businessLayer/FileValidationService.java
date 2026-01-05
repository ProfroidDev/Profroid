package com.profroid.profroidapp.filesubdomain.businessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileValidationService {

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
