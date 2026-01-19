package com.profroid.profroidapp.PartTesting.partBusinessLayer;

import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.partsubdomain.businessLayer.PartServiceImpl;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.mappingLayer.PartRequestMapper;
import com.profroid.profroidapp.partsubdomain.mappingLayer.PartResponseMapper;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.generators.InventoryPdfGenerator;
import com.profroid.profroidapp.utils.generators.InventoryPdfGenerator.InventoryPdfResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class PartServiceUnitTest {

    private PartRepository partRepository;
    private PartResponseMapper responseMapper;
    private PartRequestMapper requestMapper;
    private PartServiceImpl partService;
    private FileService fileService;
    private InventoryPdfGenerator inventoryPdfGenerator;

    private final String VALID_PART_ID = "PC-999999";

    private Part existingPart;
    private PartRequestModel validRequest;

    @BeforeEach
    void setup() {
        partRepository = mock(PartRepository.class);
        responseMapper = mock(PartResponseMapper.class);
        requestMapper = mock(PartRequestMapper.class);
        fileService = mock(FileService.class);
        inventoryPdfGenerator = mock(InventoryPdfGenerator.class);

        partService = new PartServiceImpl(partRepository, responseMapper, requestMapper, fileService, inventoryPdfGenerator);

        existingPart = new Part();
        existingPart.setPartIdentifier(new PartIdentifier(VALID_PART_ID));
        existingPart.setName("Filter");
        existingPart.setAvailable(true);

        validRequest = PartRequestModel.builder()
                .name("Filter")
                .available(true)
                .build();
    }

    @Test
    void getAllParts_success() {
        when(partRepository.findAll()).thenReturn(List.of(existingPart));
        when(responseMapper.toResponseModelList(anyList())).thenReturn(
                List.of(mock(com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel.class))
        );

        var result = partService.getAllParts();

        assertEquals(1, result.size());
        verify(partRepository, times(1)).findAll();
    }

    @Test
    void getPartById_validId_success() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);
        when(responseMapper.toResponseModel(existingPart)).thenReturn(
                mock(com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel.class)
        );

        var result = partService.getPartById(VALID_PART_ID);

        assertNotNull(result);
    }


    @Test
    void getPartById_notFound_throws404() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () ->
                partService.getPartById(VALID_PART_ID)
        );
    }

    @Test
    void createPart_success() {
        PartIdentifier generated = new PartIdentifier("PRT-XYZ999");

        Part mapped = new Part();
        mapped.setPartIdentifier(generated);
        mapped.setName("New Part");
        mapped.setAvailable(true);

        when(partRepository.findPartByName("New Part")).thenReturn(null);
        when(requestMapper.toEntity(any(), any())).thenReturn(mapped);
        when(partRepository.save(mapped)).thenReturn(mapped);
        when(responseMapper.toResponseModel(mapped))
                .thenReturn(mock(com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel.class));

        PartRequestModel request = PartRequestModel.builder()
                .name("New Part")
                .available(true)
                .build();

        var response = partService.createPart(request);

        assertNotNull(response);
        verify(partRepository).save(mapped);
    }

    @Test
    void createPart_duplicateName_throws409() {
        when(partRepository.findPartByName("Filter")).thenReturn(existingPart);

        assertThrows(ResourceAlreadyExistsException.class, () ->
                partService.createPart(validRequest)
        );
    }

    @Test
    void updatePart_success() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);
        when(partRepository.findPartByName("Filter")).thenReturn(existingPart);
        when(partRepository.save(existingPart)).thenReturn(existingPart);

        when(responseMapper.toResponseModel(existingPart))
                .thenReturn(mock(com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel.class));

        var result = partService.updatePart(VALID_PART_ID, validRequest);

        assertNotNull(result);
        verify(partRepository).save(existingPart);
    }


    @Test
    void updatePart_notFound_throws404() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () ->
                partService.updatePart(VALID_PART_ID, validRequest)
        );
    }

    @Test
    void updatePart_duplicateName_throws409() {
        Part anotherPart = new Part();
        anotherPart.setPartIdentifier(new PartIdentifier("PRT-OTHER999"));
        anotherPart.setName("Filter");

        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);
        when(partRepository.findPartByName("Filter")).thenReturn(anotherPart);

        assertThrows(ResourceAlreadyExistsException.class, () ->
                partService.updatePart(VALID_PART_ID, validRequest)
        );
    }

    @Test
    void deletePart_success() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);

        partService.deletePart(VALID_PART_ID);

        assertFalse(existingPart.getAvailable());
        verify(partRepository).save(existingPart);
    }


    @Test
    void deletePart_notFound_throws404() {
        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () ->
                partService.deletePart(VALID_PART_ID)
        );
    }

    @Test
    void deletePart_alreadyUnavailable_throws400() {
        existingPart.setAvailable(false);

        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);

        assertThrows(com.profroid.profroidapp.utils.exceptions.InvalidOperationException.class, () ->
                partService.deletePart(VALID_PART_ID)
        );
    }

    // ==================== uploadPartImage TESTS ====================

    @Test
    void uploadPartImage_success() {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);

        StoredFile stored = new StoredFile();
        stored.setId(UUID.randomUUID());

        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);
        when(fileService.upload(mockFile, FileOwnerType.PART, VALID_PART_ID, FileCategory.IMAGE)).thenReturn(stored);
        when(partRepository.save(existingPart)).thenReturn(existingPart);
        when(responseMapper.toResponseModel(existingPart))
                .thenReturn(mock(PartResponseModel.class));

        PartResponseModel result = partService.uploadPartImage(VALID_PART_ID, mockFile);

        assertNotNull(result);
        assertEquals(stored.getId(), existingPart.getImageFileId());
        verify(fileService).upload(mockFile, FileOwnerType.PART, VALID_PART_ID, FileCategory.IMAGE);
        verify(partRepository).save(existingPart);
    }

    @Test
    void uploadPartImage_emptyFile_throwsInvalidOperation() {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(true);

        assertThrows(InvalidOperationException.class, () ->
                partService.uploadPartImage(VALID_PART_ID, mockFile)
        );
    }

    @Test
    void uploadPartImage_nullFile_throwsInvalidOperation() {
        assertThrows(InvalidOperationException.class, () ->
                partService.uploadPartImage(VALID_PART_ID, null)
        );
    }

    @Test
    void uploadPartImage_partNotFound_throws404() {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);

        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class, () ->
                partService.uploadPartImage(VALID_PART_ID, mockFile)
        );
    }

    @Test
    void uploadPartImage_withPreviousImage_deletesPreviousImage() {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);

        UUID previousImageId = UUID.randomUUID();
        existingPart.setImageFileId(previousImageId);

        StoredFile stored = new StoredFile();
        stored.setId(UUID.randomUUID());

        when(partRepository.findPartByPartIdentifier_PartId(VALID_PART_ID)).thenReturn(existingPart);
        when(fileService.upload(mockFile, FileOwnerType.PART, VALID_PART_ID, FileCategory.IMAGE)).thenReturn(stored);
        when(partRepository.save(existingPart)).thenReturn(existingPart);
        when(responseMapper.toResponseModel(existingPart))
                .thenReturn(mock(PartResponseModel.class));

        PartResponseModel result = partService.uploadPartImage(VALID_PART_ID, mockFile);

        assertNotNull(result);
        verify(fileService).delete(previousImageId);
    }

    // ==================== createPartWithImage TESTS ====================

    @Test
    void createPartWithImage_withImage_success() {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);

        PartIdentifier generated = new PartIdentifier("PRT-IMG-001");
        Part createdPart = new Part();
        createdPart.setPartIdentifier(generated);
        createdPart.setName("New Part With Image");
        createdPart.setAvailable(true);

        StoredFile stored = new StoredFile();
        stored.setId(UUID.randomUUID());

        PartResponseModel response = mock(PartResponseModel.class);
        when(response.getPartId()).thenReturn("PRT-IMG-001");

        when(partRepository.findPartByName("New Part With Image")).thenReturn(null);
        when(requestMapper.toEntity(any(), any())).thenReturn(createdPart);
        when(partRepository.save(createdPart)).thenReturn(createdPart);
        when(responseMapper.toResponseModel(any(Part.class))).thenReturn(response);
        when(partRepository.findPartByPartIdentifier_PartId("PRT-IMG-001")).thenReturn(createdPart);
        when(fileService.upload(mockFile, FileOwnerType.PART, "PRT-IMG-001", FileCategory.IMAGE)).thenReturn(stored);

        PartRequestModel request = PartRequestModel.builder()
                .name("New Part With Image")
                .available(true)
                .build();

        PartResponseModel result = partService.createPartWithImage(request, mockFile);

        assertNotNull(result);
        verify(fileService).upload(mockFile, FileOwnerType.PART, "PRT-IMG-001", FileCategory.IMAGE);
    }

    @Test
    void createPartWithImage_withoutImage_returnsPartWithoutImage() {
        PartIdentifier generated = new PartIdentifier("PRT-NO-IMG-001");
        Part createdPart = new Part();
        createdPart.setPartIdentifier(generated);
        createdPart.setName("New Part No Image");
        createdPart.setAvailable(true);

        PartResponseModel response = mock(PartResponseModel.class);

        when(partRepository.findPartByName("New Part No Image")).thenReturn(null);
        when(requestMapper.toEntity(any(), any())).thenReturn(createdPart);
        when(partRepository.save(createdPart)).thenReturn(createdPart);
        when(responseMapper.toResponseModel(createdPart)).thenReturn(response);

        PartRequestModel request = PartRequestModel.builder()
                .name("New Part No Image")
                .available(true)
                .build();

        PartResponseModel result = partService.createPartWithImage(request, null);

        assertNotNull(result);
        verify(fileService, never()).upload(any(), any(), any(), any());
    }

    // ==================== exportInventoryToPdf TESTS ====================

    @Test
    void exportInventoryToPdf_success() {
        PartResponseModel partResponse = mock(PartResponseModel.class);
        List<PartResponseModel> parts = List.of(partResponse);

        StoredFile stored = new StoredFile();
        stored.setId(UUID.randomUUID());
        stored.setBucket("test-bucket");
        stored.setObjectKey("test-key");

        InventoryPdfResult pdfResult = new InventoryPdfResult(new byte[]{1, 2, 3}, stored, "inventory.pdf");

        when(partRepository.findAll()).thenReturn(List.of(existingPart));
        when(responseMapper.toResponseModelList(anyList())).thenReturn(parts);
        when(inventoryPdfGenerator.generateAndStoreInventoryPdf(parts, fileService)).thenReturn(pdfResult);

        byte[] result = partService.exportInventoryToPdf();

        assertArrayEquals(new byte[]{1, 2, 3}, result);
        verify(inventoryPdfGenerator).generateAndStoreInventoryPdf(parts, fileService);
    }

    @Test
    void exportInventoryToPdf_emptyInventory_success() {
        List<PartResponseModel> parts = Collections.emptyList();

        StoredFile stored = new StoredFile();
        stored.setId(UUID.randomUUID());

        InventoryPdfResult pdfResult = new InventoryPdfResult(new byte[]{}, stored, "empty_inventory.pdf");

        when(partRepository.findAll()).thenReturn(Collections.emptyList());
        when(responseMapper.toResponseModelList(anyList())).thenReturn(parts);
        when(inventoryPdfGenerator.generateAndStoreInventoryPdf(parts, fileService)).thenReturn(pdfResult);

        byte[] result = partService.exportInventoryToPdf();

        assertArrayEquals(new byte[]{}, result);
        verify(inventoryPdfGenerator).generateAndStoreInventoryPdf(parts, fileService);
    }
}