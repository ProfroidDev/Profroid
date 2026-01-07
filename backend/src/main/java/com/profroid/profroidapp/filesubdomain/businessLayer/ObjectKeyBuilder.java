package com.profroid.profroidapp.filesubdomain.businessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;

import java.util.UUID;

public class ObjectKeyBuilder {

    private ObjectKeyBuilder() {}

    // Example:
    // APPOINTMENT/123/IMAGE/{fileId}/before.jpg
    public static String build(FileOwnerType ownerType, String ownerId, FileCategory category, UUID fileId, String safeFilename) {
        return ownerType.name() + "/" + ownerId + "/" + category.name() + "/" + fileId + "/" + safeFilename;
    }
}
