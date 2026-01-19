package com.profroid.profroidapp.FileTesting.fileBusinessLayer;

import com.profroid.profroidapp.filesubdomain.businessLayer.FileServiceImpl;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileValidationService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import io.minio.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class FileServiceUnitTest {

    private MinioClient minioClient;
    private StoredFileRepository fileRepository;
    private FileValidationService validationService;
    private FileServiceImpl fileService;

    private static final String BUCKET = "private-bucket";

    @BeforeEach
    void setup() {
        minioClient = mock(MinioClient.class);
        fileRepository = mock(StoredFileRepository.class);
        validationService = mock(FileValidationService.class);
        fileService = new FileServiceImpl(minioClient, fileRepository, validationService, BUCKET);
    }

    @Test
    void upload_validFile_savesAndReturnsStoredFile() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.pdf");
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(1024L);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
        when(minioClient.putObject(any(PutObjectArgs.class))).thenReturn(mock(ObjectWriteResponse.class));

        ArgumentCaptor<StoredFile> captor = ArgumentCaptor.forClass(StoredFile.class);
        when(fileRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        StoredFile result = fileService.upload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE);

        verify(validationService).validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE);
        verify(minioClient).putObject(any(PutObjectArgs.class));
        verify(fileRepository).save(any(StoredFile.class));

        StoredFile saved = captor.getValue();
        assertEquals(BUCKET, saved.getBucket());
        assertEquals("test.pdf", saved.getOriginalFilename());
        assertEquals("application/pdf", saved.getContentType());
        assertEquals(1024L, saved.getSizeBytes());
        assertEquals(FileOwnerType.APPOINTMENT.name(), saved.getOwnerType());
        assertEquals("APPT-123", saved.getOwnerId());
        assertEquals(FileCategory.IMAGE.name(), saved.getCategory());
    }

    @Test
    void getOrThrow_fileExists_returnsStoredFile() {
        UUID fileId = UUID.randomUUID();
        StoredFile stored = new StoredFile();
        stored.setId(fileId);
        when(fileRepository.findByIdAndDeletedAtIsNull(fileId)).thenReturn(Optional.of(stored));

        StoredFile result = fileService.getOrThrow(fileId);

        assertEquals(fileId, result.getId());
        verify(fileRepository).findByIdAndDeletedAtIsNull(fileId);
    }

    @Test
    void getOrThrow_fileNotFound_throwsResourceNotFound() {
        UUID fileId = UUID.randomUUID();
        when(fileRepository.findByIdAndDeletedAtIsNull(fileId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> fileService.getOrThrow(fileId));
    }

    @Test
    void openStream_validFile_returnsInputStream() throws Exception {
        StoredFile stored = new StoredFile();
        stored.setBucket(BUCKET);
        stored.setObjectKey("APPOINTMENT/APPT-123/IMAGE/uuid/test.pdf");

        GetObjectResponse response = mock(GetObjectResponse.class);
        when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(response);

        InputStream result = fileService.openStream(stored);

        assertNotNull(result);
        assertEquals(response, result);
        verify(minioClient).getObject(any(GetObjectArgs.class));
    }

    @Test
    void delete_validFile_removesFromMinioAndDb() throws Exception {
        UUID fileId = UUID.randomUUID();
        StoredFile stored = new StoredFile();
        stored.setId(fileId);
        stored.setBucket(BUCKET);
        stored.setObjectKey("APPOINTMENT/APPT-123/IMAGE/uuid/test.pdf");

        when(fileRepository.findByIdAndDeletedAtIsNull(fileId)).thenReturn(Optional.of(stored));
        doNothing().when(minioClient).removeObject(any(RemoveObjectArgs.class));
        doNothing().when(fileRepository).delete(stored);

        fileService.delete(fileId);

        verify(minioClient).removeObject(any(RemoveObjectArgs.class));
        verify(fileRepository).delete(stored);
    }

    @Test
    void delete_fileNotFound_throwsResourceNotFound() {
        UUID fileId = UUID.randomUUID();
        when(fileRepository.findByIdAndDeletedAtIsNull(fileId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> fileService.delete(fileId));
    }

    @Test
    void list_withCategory_returnsFilteredList() {
        StoredFile f1 = new StoredFile();
        f1.setOwnerId("APPT-123");
        f1.setCategory(FileCategory.IMAGE.name());

        when(fileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
                eq(FileOwnerType.APPOINTMENT.name()), eq("APPT-123"), eq(FileCategory.IMAGE.name())))
                .thenReturn(List.of(f1));

        List<StoredFile> result = fileService.list(FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE);

        assertEquals(1, result.size());
        assertEquals("APPT-123", result.get(0).getOwnerId());
        verify(fileRepository).findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
                FileOwnerType.APPOINTMENT.name(), "APPT-123", FileCategory.IMAGE.name());
    }

    @Test
    void list_withoutCategory_returnsAllForOwner() {
        StoredFile f1 = new StoredFile();
        f1.setOwnerId("APPT-123");
        f1.setCategory(FileCategory.IMAGE.name());

        StoredFile f2 = new StoredFile();
        f2.setOwnerId("APPT-123");
        f2.setCategory(FileCategory.REPORT.name());

        when(fileRepository.findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull(
                eq(FileOwnerType.APPOINTMENT.name()), eq("APPT-123")))
                .thenReturn(List.of(f1, f2));

        List<StoredFile> result = fileService.list(FileOwnerType.APPOINTMENT, "APPT-123", null);

        assertEquals(2, result.size());
        verify(fileRepository).findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull(
                FileOwnerType.APPOINTMENT.name(), "APPT-123");
    }

    @Test
    void upload_nullContentType_resolvesToDefault() throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.dat");
        when(file.getContentType()).thenReturn(null);
        when(file.getSize()).thenReturn(512L);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{1}));

        when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
        when(minioClient.putObject(any(PutObjectArgs.class))).thenReturn(mock(ObjectWriteResponse.class));

        ArgumentCaptor<StoredFile> captor = ArgumentCaptor.forClass(StoredFile.class);
        when(fileRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        fileService.upload(file, FileOwnerType.REPORT, "REP-1", FileCategory.REPORT);

        StoredFile saved = captor.getValue();
        assertEquals("application/octet-stream", saved.getContentType());
    }
}
