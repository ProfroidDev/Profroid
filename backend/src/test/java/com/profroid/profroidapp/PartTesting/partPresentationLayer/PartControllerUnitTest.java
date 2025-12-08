package com.profroid.profroidapp.PartTesting.partPresentationLayer;

import com.profroid.profroidapp.partsubdomain.businessLayer.PartService;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartController;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PartControllerUnitTest {

    @InjectMocks
    private PartController partController;

    @Mock
    private PartService partService;

    private final String VALID_PART_ID = "PART-123";
    private final String INVALID_PART_ID = "bad-id";
    private final String NON_EXISTING_PART_ID = "PART-999";

    private PartRequestModel validRequest;
    private PartResponseModel validResponse;

    @BeforeEach
    void setup() {
        validRequest = PartRequestModel.builder()
                .name("Cooling Fan")
                .available(true)
                .build();

        validResponse = PartResponseModel.builder()
                .partId(VALID_PART_ID)
                .name("Cooling Fan")
                .available(true)
                .build();
    }


    @Test
    void whenGetAllParts_withExistingParts_thenReturnList() {
        List<PartResponseModel> expected = Arrays.asList(validResponse, validResponse);

        when(partService.getAllParts()).thenReturn(expected);

        ResponseEntity<List<PartResponseModel>> response = partController.getAllParts();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());

        verify(partService, times(1)).getAllParts();
    }

    @Test
    void whenGetAllParts_withNoParts_thenReturnEmptyList() {
        when(partService.getAllParts()).thenReturn(Collections.emptyList());

        ResponseEntity<List<PartResponseModel>> response = partController.getAllParts();

        assertNotNull(response);
        assertTrue(response.getBody().isEmpty());
        verify(partService, times(1)).getAllParts();
    }


    @Test
    void whenGetPartById_withValidId_thenReturnPart() {
        when(partService.getPartById(VALID_PART_ID)).thenReturn(validResponse);

        ResponseEntity<PartResponseModel> response =
                partController.getPartById(VALID_PART_ID);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(VALID_PART_ID, response.getBody().getPartId());

        verify(partService).getPartById(VALID_PART_ID);
    }

    @Test
    void whenGetPartById_withInvalidId_thenThrowInvalidIdentifierException() {
        when(partService.getPartById(INVALID_PART_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> partController.getPartById(INVALID_PART_ID));

        verify(partService).getPartById(INVALID_PART_ID);
    }

    @Test
    void whenGetPartById_withNonExistingId_thenThrowResourceNotFoundException() {
        when(partService.getPartById(NON_EXISTING_PART_ID))
                .thenThrow(new ResourceNotFoundException("Not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> partController.getPartById(NON_EXISTING_PART_ID));

        verify(partService).getPartById(NON_EXISTING_PART_ID);
    }


    @Test
    void whenCreatePart_withValidData_thenReturnCreatedPart() {
        when(partService.createPart(any())).thenReturn(validResponse);

        ResponseEntity<PartResponseModel> response =
                partController.createPart(validRequest);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Cooling Fan", response.getBody().getName());

        verify(partService).createPart(any());
    }

    @Test
    void whenCreatePart_withDuplicateName_thenThrowResourceAlreadyExistsException() {
        when(partService.createPart(any()))
                .thenThrow(new ResourceAlreadyExistsException("Part exists"));

        assertThrows(ResourceAlreadyExistsException.class,
                () -> partController.createPart(validRequest));

        verify(partService).createPart(any());
    }


    @Test
    void whenUpdatePart_withValidData_thenReturnUpdatedPart() {
        PartResponseModel updated = PartResponseModel.builder()
                .partId(VALID_PART_ID)
                .name("Updated Fan")
                .available(true)
                .build();

        when(partService.updatePart(eq(VALID_PART_ID), any())).thenReturn(updated);

        ResponseEntity<PartResponseModel> response =
                partController.updatePart(VALID_PART_ID, validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Updated Fan", response.getBody().getName());

        verify(partService).updatePart(eq(VALID_PART_ID), any());
    }

    @Test
    void whenUpdatePart_withInvalidId_thenThrowInvalidIdentifierException() {
        when(partService.updatePart(eq(INVALID_PART_ID), any()))
                .thenThrow(new InvalidIdentifierException("Invalid"));

        assertThrows(InvalidIdentifierException.class,
                () -> partController.updatePart(INVALID_PART_ID, validRequest));

        verify(partService).updatePart(eq(INVALID_PART_ID), any());
    }

    @Test
    void whenUpdatePart_withNonExistingId_thenThrowResourceNotFoundException() {
        when(partService.updatePart(eq(NON_EXISTING_PART_ID), any()))
                .thenThrow(new ResourceNotFoundException("Not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> partController.updatePart(NON_EXISTING_PART_ID, validRequest));

        verify(partService).updatePart(eq(NON_EXISTING_PART_ID), any());
    }


    @Test
    void whenDeletePart_withValidId_thenReturn204() {
        doNothing().when(partService).deletePart(VALID_PART_ID);

        ResponseEntity<Void> response =
                partController.deletePart(VALID_PART_ID);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(partService).deletePart(VALID_PART_ID);
    }

    @Test
    void whenDeletePart_withInvalidId_thenThrowInvalidIdentifierException() {
        doThrow(new InvalidIdentifierException("Invalid"))
                .when(partService).deletePart(INVALID_PART_ID);

        assertThrows(InvalidIdentifierException.class,
                () -> partController.deletePart(INVALID_PART_ID));

        verify(partService).deletePart(INVALID_PART_ID);
    }

    @Test
    void whenDeletePart_withNonExistingId_thenThrowResourceNotFoundException() {
        doThrow(new ResourceNotFoundException("Not found"))
                .when(partService).deletePart(NON_EXISTING_PART_ID);

        assertThrows(ResourceNotFoundException.class,
                () -> partController.deletePart(NON_EXISTING_PART_ID));

        verify(partService).deletePart(NON_EXISTING_PART_ID);
    }
}
