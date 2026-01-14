package com.profroid.profroidapp.filesubdomain.businessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import com.profroid.profroidapp.filesubdomain.utils.FilenameSanitizer;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import io.minio.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private final MinioClient minio;
    private final StoredFileRepository repo;
    private final FileValidationService validator;
    private final String privateBucket;

    public FileServiceImpl(
            MinioClient minio,
            StoredFileRepository repo,
            FileValidationService validator,
            @Value("${minio.bucket-private}") String privateBucket
    ) {
        this.minio = minio;
        this.repo = repo;
        this.validator = validator;
        this.privateBucket = privateBucket;
    }

    @Override
    public StoredFile upload(MultipartFile file, FileOwnerType ownerType, String ownerId, FileCategory category) {
        validator.validateUpload(file, ownerType, ownerId, category);

        try (InputStream input = file.getInputStream()) {
            ensureBucketExists(privateBucket);

            UUID fileId = UUID.randomUUID();
            String safeName = FilenameSanitizer.sanitize(file.getOriginalFilename());
            String objectKey = ObjectKeyBuilder.build(ownerType, ownerId, category, fileId, safeName);

            minio.putObject(
                    PutObjectArgs.builder()
                            .bucket(privateBucket)
                            .object(objectKey)
                    .stream(input, file.getSize(), -1)
                    .contentType(resolveContentType(file.getContentType()))
                            .build()
            );

            StoredFile stored = new StoredFile();
            stored.setId(fileId);
            stored.setBucket(privateBucket);
            stored.setObjectKey(objectKey);
            stored.setOriginalFilename(safeName);
            stored.setContentType(resolveContentType(file.getContentType()));
            stored.setSizeBytes(file.getSize());
            stored.setOwnerType(ownerType.name());
            stored.setOwnerId(ownerId);
            stored.setCategory(category.name());
            stored.setCreatedAt(Instant.now());

            return repo.save(stored);

        } catch (Exception e) {
            throw new RuntimeException("Upload failed.", e);
        }
    }

    @Override
    public StoredFile getOrThrow(UUID fileId) {
        return repo.findByIdAndDeletedAtIsNull(fileId)
            .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));
    }

    @Override
    public InputStream openStream(StoredFile f) {
        try {
            return minio.getObject(
                    GetObjectArgs.builder()
                            .bucket(f.getBucket())
                            .object(f.getObjectKey())
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Download failed.", e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void delete(UUID fileId) {
        StoredFile f = getOrThrow(fileId);

        try {
            // Remove from MinIO
            minio.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(f.getBucket())
                            .object(f.getObjectKey())
                            .build()
            );

            // Hard delete from DB (permanent removal, not soft delete)
            repo.delete(f);

        } catch (Exception e) {
            throw new RuntimeException("Delete failed.", e);
        }
    }


    @Override
    public List<StoredFile> list(FileOwnerType ownerType, String ownerId, FileCategory category) {
        if (category == null) {
            return repo.findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull(ownerType.name(), ownerId);
        }
        return repo.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(ownerType.name(), ownerId, category.name());
    }

    private void ensureBucketExists(String bucket) throws Exception {
        boolean exists = minio.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );
        if (!exists) {
            minio.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
        }
    }

    private String resolveContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType;
    }
}
