package com.profroid.profroidapp.FileTesting.filePresentationLayer;

import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.mappingLayer.FileResponseMapper;
import com.profroid.profroidapp.filesubdomain.presentationLayer.FileController;
import com.profroid.profroidapp.filesubdomain.presentationLayer.FileResponseModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FileControllerUnitTest {

    @Mock
    private FileService fileService;

    @Mock
    private FileResponseMapper mapper;

    @InjectMocks
    private FileController fileController;

    private StoredFile stored;
    private FileResponseModel responseModel;

    @BeforeEach
    void setup() {
        stored = new StoredFile();
        stored.setId(UUID.randomUUID());
        stored.setBucket("private");
        stored.setObjectKey("REPORT/REP-123/BILL/test.pdf");
        stored.setOriginalFilename("test.pdf");
        stored.setContentType("application/pdf");
        stored.setSizeBytes(3L);
        stored.setOwnerType(FileOwnerType.REPORT.name());
        stored.setOwnerId("REP-123");
        stored.setCategory(FileCategory.REPORT.name());
        stored.setCreatedAt(Instant.now());

        responseModel = FileResponseModel.builder()
                .fileId(stored.getId().toString())
                .ownerType(stored.getOwnerType())
                .ownerId(stored.getOwnerId())
                .category(stored.getCategory())
                .originalFilename(stored.getOriginalFilename())
                .contentType(stored.getContentType())
                .sizeBytes(stored.getSizeBytes())
                .createdAt(stored.getCreatedAt())
                .build();
    }

    @Test
    void upload_valid_returnsCreated() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[]{1, 2, 3}
        );
        when(fileService.upload(eq(file), eq(FileOwnerType.REPORT), eq("REP-123"), eq(FileCategory.REPORT)))
                .thenReturn(stored);
        when(mapper.toResponseModel(eq(stored))).thenReturn(responseModel);

        ResponseEntity<FileResponseModel> response = fileController.upload("report", "REP-123", "report", file);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("test.pdf", response.getBody().getOriginalFilename());
        verify(fileService).upload(eq(file), eq(FileOwnerType.REPORT), eq("REP-123"), eq(FileCategory.REPORT));
    }

    @Test
    void list_returnsOkWithItems() {
        when(fileService.list(eq(FileOwnerType.REPORT), eq("REP-123"), isNull()))
                .thenReturn(List.of(stored));
        when(mapper.toResponseModelList(anyList())).thenReturn(List.of(responseModel));

        ResponseEntity<List<FileResponseModel>> response = fileController.list("report", "REP-123", null);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verify(fileService).list(eq(FileOwnerType.REPORT), eq("REP-123"), isNull());
    }

    @Test
    void metadata_returnsOk() {
        when(fileService.getOrThrow(eq(stored.getId()))).thenReturn(stored);
        when(mapper.toResponseModel(eq(stored))).thenReturn(responseModel);

        ResponseEntity<FileResponseModel> response = fileController.metadata(stored.getId());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(stored.getId().toString(), response.getBody().getFileId());
        verify(fileService).getOrThrow(eq(stored.getId()));
    }

    @Test
    void download_returnsInlineForImages_andAttachmentForOthers() {
        // Non-image: application/pdf -> attachment
        when(fileService.getOrThrow(eq(stored.getId()))).thenReturn(stored);
        when(fileService.openStream(eq(stored))).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

        ResponseEntity<InputStreamResource> response = fileController.download(stored.getId());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        String cd = response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        assertNotNull(cd);
        assertTrue(cd.toLowerCase(java.util.Locale.ROOT).startsWith("attachment"));

        // Image: category IMAGE -> inline disposition
        StoredFile image = new StoredFile();
        image.setId(UUID.randomUUID());
        image.setBucket("private");
        image.setObjectKey("IMAGE/OWN-1/IMAGE/photo.jpg");
        image.setOriginalFilename("photo.jpg");
        image.setContentType("image/jpeg");
        image.setSizeBytes(10L);
        image.setOwnerType(FileOwnerType.CUSTOMER.name());
        image.setOwnerId("OWN-1");
        image.setCategory(FileCategory.IMAGE.name());
        image.setCreatedAt(Instant.now());

        when(fileService.getOrThrow(eq(image.getId()))).thenReturn(image);
        when(fileService.openStream(eq(image))).thenReturn(new ByteArrayInputStream(new byte[]{9, 9, 9}));

        ResponseEntity<InputStreamResource> responseImg = fileController.download(image.getId());
        assertEquals(MediaType.IMAGE_JPEG, responseImg.getHeaders().getContentType());
        String cdImg = responseImg.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        assertNotNull(cdImg);
        assertTrue(cdImg.toLowerCase(java.util.Locale.ROOT).startsWith("inline"));
    }

    @Test
    void delete_returnsNoContent() {
        doNothing().when(fileService).delete(eq(stored.getId()));
        ResponseEntity<Void> response = fileController.delete(stored.getId());
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(fileService).delete(eq(stored.getId()));
    }
}
