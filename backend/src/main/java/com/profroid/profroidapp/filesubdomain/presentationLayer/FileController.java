package com.profroid.profroidapp.filesubdomain.presentationLayer;

import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.mappingLayer.FileResponseMapper;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileService fileService;
    private final FileResponseMapper mapper;

    public FileController(FileService fileService, FileResponseMapper mapper) {
        this.fileService = fileService;
        this.mapper = mapper;
    }

    @PostMapping(value = "/{ownerType}/{ownerId}/{category}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponseModel> upload(
            @PathVariable String ownerType,
            @PathVariable String ownerId,
            @PathVariable String category,
            @RequestPart("file") MultipartFile file
    ) {
        FileOwnerType resolvedOwnerType = parseOwnerType(ownerType);
        FileCategory resolvedCategory = parseCategory(category);

        StoredFile stored = fileService.upload(file, resolvedOwnerType, ownerId, resolvedCategory);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponseModel(stored));
    }

    @GetMapping
    public ResponseEntity<List<FileResponseModel>> list(
            @RequestParam String ownerType,
            @RequestParam String ownerId,
            @RequestParam(required = false) String category
    ) {
        FileOwnerType resolvedOwnerType = parseOwnerType(ownerType);
        FileCategory resolvedCategory = category != null ? parseCategory(category) : null;

        List<StoredFile> files = fileService.list(resolvedOwnerType, ownerId, resolvedCategory);
        return ResponseEntity.ok(mapper.toResponseModelList(files));
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<FileResponseModel> metadata(@PathVariable UUID fileId) {
        StoredFile file = fileService.getOrThrow(fileId);
        return ResponseEntity.ok(mapper.toResponseModel(file));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID fileId) {
        StoredFile file = fileService.getOrThrow(fileId);

        InputStreamResource resource = new InputStreamResource(fileService.openStream(file));
        MediaType mediaType = resolveMediaType(file.getContentType());

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(file.getOriginalFilename(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentLength(file.getSizeBytes())
                .body(resource);
    }

    private FileOwnerType parseOwnerType(String raw) {
        try {
            return FileOwnerType.valueOf(raw.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new InvalidOperationException("Unknown owner type: " + raw);
        }
    }

    private FileCategory parseCategory(String raw) {
        try {
            return FileCategory.valueOf(raw.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new InvalidOperationException("Unknown file category: " + raw);
        }
    }

    private MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
