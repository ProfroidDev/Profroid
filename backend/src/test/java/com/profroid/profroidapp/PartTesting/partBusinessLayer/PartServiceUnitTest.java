package com.profroid.profroidapp.PartTesting.partBusinessLayer;

import com.profroid.profroidapp.partsubdomain.businessLayer.PartServiceImpl;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartRequestMapper;
import com.profroid.profroidapp.partsubdomain.mapperLayer.PartResponseMapper;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PartServiceUnitTest {

    private PartRepository partRepository;
    private PartResponseMapper responseMapper;
    private PartRequestMapper requestMapper;
    private PartServiceImpl partService;

    private final String VALID_PART_ID = "PC-999999";

    private Part existingPart;
    private PartRequestModel validRequest;

    @BeforeEach
    void setup() {
        partRepository = mock(PartRepository.class);
        responseMapper = mock(PartResponseMapper.class);
        requestMapper = mock(PartRequestMapper.class);

        partService = new PartServiceImpl(partRepository, responseMapper, requestMapper);

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
    void getPartById_invalidId_throws422() {
        assertThrows(InvalidIdentifierException.class, () ->
                partService.getPartById("")
        );
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
    void updatePart_invalidId_throws422() {
        assertThrows(InvalidIdentifierException.class, () ->
                partService.updatePart("", validRequest)
        );
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
    void deletePart_invalidId_throws422() {
        assertThrows(InvalidIdentifierException.class, () ->
                partService.deletePart("")
        );
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
}