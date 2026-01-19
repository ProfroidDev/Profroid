package com.profroid.profroidapp.FileTesting.fileBusinessLayer;

import com.profroid.profroidapp.filesubdomain.businessLayer.FileValidationService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class FileValidationServiceUnitTest {

    private FileValidationService validationService;

    @BeforeEach
    void setup() {
        validationService = new FileValidationService();
        // Default 10MB
        ReflectionTestUtils.setField(validationService, "maxFileSizeBytes", 10485760L);
    }

    @Test
    void validateUpload_validFile_passes() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn("image/png");

        assertDoesNotThrow(() ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_nullOwnerType_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, null, "APPT-123", FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_nullOwnerId_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, null, FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_nullCategory_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", null)
        );
    }

    @Test
    void validateUpload_emptyFile_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_exceedsMaxSize_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(20 * 1024 * 1024L); // 20MB
        when(file.getContentType()).thenReturn("image/png");

        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_imageCategoryNonImageType_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn("application/pdf");

        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE)
        );
    }

    @Test
    void validateUpload_reportCategoryNonPdfType_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn("image/png");

        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.REPORT, "REP-123", FileCategory.REPORT)
        );
    }

    @Test
    void validateUpload_reportCategoryPdf_passes() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn("application/pdf");

        assertDoesNotThrow(() ->
                validationService.validateUpload(file, FileOwnerType.REPORT, "REP-123", FileCategory.REPORT)
        );
    }

    @Test
    void validateUpload_nullContentType_throwsIllegalArgument() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getContentType()).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () ->
                validationService.validateUpload(file, FileOwnerType.APPOINTMENT, "APPT-123", FileCategory.IMAGE)
        );
    }
}
