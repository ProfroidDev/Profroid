package com.profroid.profroidapp.filesubdomain.businessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import org.springframework.web.multipart.MultipartFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public interface FileService {
    StoredFile upload(MultipartFile file, FileOwnerType ownerType, String ownerId, FileCategory category);
    StoredFile getOrThrow(UUID fileId);
    InputStream openStream(StoredFile file);
    void delete(UUID fileId);
    List<StoredFile> list(FileOwnerType ownerType, String ownerId, FileCategory category);
}
