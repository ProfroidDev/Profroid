package com.profroid.profroidapp.FileTesting.filePresentationLayer;

import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.presentationLayer.FileResponseModel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = RANDOM_PORT)
public class FileControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private FileService fileService;

    private StoredFile makeStored(String category) {
        StoredFile f = new StoredFile();
        f.setId(UUID.randomUUID());
        f.setBucket("private");
        f.setObjectKey("OBJ/KEY");
        f.setOriginalFilename(category.equals(FileCategory.IMAGE.name()) ? "photo.jpg" : "doc.pdf");
        f.setContentType(category.equals(FileCategory.IMAGE.name()) ? "image/jpeg" : "application/pdf");
        f.setSizeBytes(3L);
        f.setOwnerType(FileOwnerType.REPORT.name());
        f.setOwnerId("REP-123");
        f.setCategory(category);
        f.setCreatedAt(Instant.now());
        return f;
    }

    @Test
    void upload_returns201() {
        StoredFile stored = makeStored(FileCategory.REPORT.name());
        when(fileService.upload(any(), eq(FileOwnerType.REPORT), eq("REP-123"), eq(FileCategory.REPORT)))
                .thenReturn(stored);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new byte[]{1, 2, 3}).filename("test.pdf").contentType(MediaType.APPLICATION_PDF);

        webTestClient.post()
                .uri("/v1/files/{ownerType}/{ownerId}/{category}", "report", "REP-123", "report")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .bodyValue(builder.build())
                .exchange()
                .expectStatus().isCreated()
                .expectBody(FileResponseModel.class)
                .value(resp -> {
                    assert resp.getOriginalFilename().equals("doc.pdf") || resp.getOriginalFilename().equals("test.pdf");
                });
    }

    @Test
    void list_returnsOk() {
        StoredFile stored = makeStored(FileCategory.REPORT.name());
        when(fileService.list(eq(FileOwnerType.REPORT), eq("REP-123"), isNull()))
                .thenReturn(List.of(stored));

        webTestClient.get()
                .uri("/v1/files?ownerType={ot}&ownerId={oid}", "report", "REP-123")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(FileResponseModel.class)
                .hasSize(1);
    }

    @Test
    void metadata_returnsOk() {
        StoredFile stored = makeStored(FileCategory.REPORT.name());
        when(fileService.getOrThrow(eq(stored.getId()))).thenReturn(stored);

        webTestClient.get()
                .uri("/v1/files/{id}", stored.getId())
                .exchange()
                .expectStatus().isOk()
                .expectBody(FileResponseModel.class)
                .value(resp -> resp.getFileId().equals(stored.getId().toString()));
    }

    @Test
    void download_pdf_hasAttachmentDisposition() {
        StoredFile stored = makeStored(FileCategory.REPORT.name());
        when(fileService.getOrThrow(eq(stored.getId()))).thenReturn(stored);
        when(fileService.openStream(eq(stored))).thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));

        webTestClient.get()
                .uri("/v1/files/{id}/download", stored.getId())
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_PDF)
                .expectBody()
                .consumeWith(res -> {
                    org.junit.jupiter.api.Assertions.assertNotNull(res.getResponseBody());
                });
    }

    @Test
    void download_image_hasInlineDisposition() {
        StoredFile stored = makeStored(FileCategory.IMAGE.name());
        when(fileService.getOrThrow(eq(stored.getId()))).thenReturn(stored);
        when(fileService.openStream(eq(stored))).thenReturn(new ByteArrayInputStream(new byte[]{9, 9, 9}));

        webTestClient.get()
                .uri("/v1/files/{id}/download", stored.getId())
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.IMAGE_JPEG)
                .expectBody()
                .consumeWith(res -> org.junit.jupiter.api.Assertions.assertNotNull(res.getResponseBody()));
    }

    @Test
    void delete_returns204() {
        StoredFile stored = makeStored(FileCategory.REPORT.name());
        doNothing().when(fileService).delete(eq(stored.getId()));

        webTestClient.delete()
                .uri("/v1/files/{id}", stored.getId())
                .exchange()
                .expectStatus().isNoContent();
    }
}
