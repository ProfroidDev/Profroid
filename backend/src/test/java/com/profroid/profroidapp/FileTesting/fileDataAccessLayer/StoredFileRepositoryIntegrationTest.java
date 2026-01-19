package com.profroid.profroidapp.FileTesting.fileDataAccessLayer;

import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
@SpringBootTest
public class StoredFileRepositoryIntegrationTest {

    @Autowired
    private StoredFileRepository repo;

    private StoredFile saved;

    @BeforeEach
    void setup() {
        repo.deleteAll();

        StoredFile f = new StoredFile();
        f.setId(UUID.randomUUID());
        f.setBucket("private");
        f.setObjectKey("REPORT/REP-1/REPORT/file.pdf");
        f.setOriginalFilename("file.pdf");
        f.setContentType("application/pdf");
        f.setSizeBytes(123L);
        f.setOwnerType("REPORT");
        f.setOwnerId("REP-1");
        f.setCategory("REPORT");
        f.setCreatedAt(Instant.now());

        saved = repo.save(f);
    }

    @AfterEach
    void cleanup() {
        repo.deleteAll();
    }

    @Test
    void findByIdAndDeletedAtIsNull_returnsFile() {
        Optional<StoredFile> found = repo.findByIdAndDeletedAtIsNull(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("file.pdf", found.get().getOriginalFilename());
    }

    @Test
    void findAllByOwnerTypeAndOwnerId_returnsList() {
        List<StoredFile> files = repo.findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull("REPORT", "REP-1");
        assertEquals(1, files.size());
        assertEquals(saved.getId(), files.get(0).getId());
    }

    @Test
    void findAllByOwnerTypeAndOwnerIdAndCategory_returnsList() {
        List<StoredFile> files = repo.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull("REPORT", "REP-1", "REPORT");
        assertEquals(1, files.size());
        assertEquals("file.pdf", files.get(0).getOriginalFilename());
    }

    @Test
    void softDelete_excludedFromQueries() {
        saved.setDeletedAt(Instant.now());
        repo.save(saved);

        assertTrue(repo.findByIdAndDeletedAtIsNull(saved.getId()).isEmpty());
        assertTrue(repo.findAllByOwnerTypeAndOwnerIdAndDeletedAtIsNull("REPORT", "REP-1").isEmpty());
        assertTrue(repo.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull("REPORT", "REP-1", "REPORT").isEmpty());
    }
}
