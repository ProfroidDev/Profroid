package com.profroid.profroidapp.CellarTesting.cellarPresentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarController;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CellarControllerUnitTest {

    @InjectMocks
    private CellarController cellarController;

    @Mock
    private CellarService cellarService;

    @Mock
    private Authentication authentication;

    private static final String VALID_CELLAR_ID = "c1234567-abcd-4f42-9911-abcdef123456";
    private static final String VALID_CUSTOMER_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String VALID_USER_ID = "123e4567-e89b-12d3-a456-426614174111";

    private static final String INVALID_CELLAR_ID = "invalid-id";
    private static final String NON_EXISTING_CELLAR_ID = "00000000-abcd-4f42-9999-abcdef999999";

    private CellarRequestModel validCellarRequest;
    private CellarResponseModel validCellarResponse;

    @BeforeEach
    void setUp() {
        // Request
        validCellarRequest = new CellarRequestModel();
        validCellarRequest.setOwnerCustomerId(new CustomerIdentifier(VALID_CUSTOMER_ID));
        validCellarRequest.setName("Wine Cellar");
        validCellarRequest.setHeight(2.5);
        validCellarRequest.setWidth(3.0);
        validCellarRequest.setDepth(2.0);
        validCellarRequest.setBottleCapacity(150);
        validCellarRequest.setHasCoolingSystem(true);
        validCellarRequest.setHasHumidityControl(true);
        validCellarRequest.setHasAutoRegulation(false);
        validCellarRequest.setCellarType(CellarType.PRIVATE);

        // Response
        validCellarResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .ownerCustomerId(VALID_CUSTOMER_ID)
                .name("Wine Cellar")
                .height(2.5)
                .width(3.0)
                .depth(2.0)
                .bottleCapacity(150)
                .hasCoolingSystem(true)
                .hasHumidityControl(true)
                .hasAutoRegulation(false)
                .cellarType(CellarType.PRIVATE)
                .isActive(true)
                .build();
    }

    // ============================================================
    // GET ALL CELLARS
    // ============================================================

    @Test
    void whenGetAllCellars_withOwnerCustomerId_thenReturnFilteredList() {
        List<CellarResponseModel> expectedList = Arrays.asList(validCellarResponse, validCellarResponse);

        when(cellarService.getAllCellars(VALID_CUSTOMER_ID)).thenReturn(expectedList);

        ResponseEntity<List<CellarResponseModel>> response =
                cellarController.getAllCellars(VALID_CUSTOMER_ID, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());

        verify(cellarService, times(1)).getAllCellars(VALID_CUSTOMER_ID);
        verify(cellarService, never()).getAllCellarsForUser(anyString());
        verifyNoInteractions(authentication);
    }

    @Test
    void whenGetAllCellars_withBlankOwnerCustomerId_thenDeriveFromAuthenticationAndReturnUserCellars() {
        when(authentication.getName()).thenReturn(VALID_USER_ID);

        List<CellarResponseModel> expectedList = List.of(validCellarResponse);
        when(cellarService.getAllCellarsForUser(VALID_USER_ID)).thenReturn(expectedList);

        ResponseEntity<List<CellarResponseModel>> response =
                cellarController.getAllCellars("   ", authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        verify(cellarService, times(1)).getAllCellarsForUser(VALID_USER_ID);
        verify(cellarService, never()).getAllCellars(anyString());
        verify(authentication, times(2)).getName();
    }

    @Test
    void whenGetAllCellars_withNullOwnerCustomerId_thenDeriveFromAuthenticationAndReturnUserCellars() {
        when(authentication.getName()).thenReturn(VALID_USER_ID);

        when(cellarService.getAllCellarsForUser(VALID_USER_ID)).thenReturn(Collections.emptyList());

        ResponseEntity<List<CellarResponseModel>> response =
                cellarController.getAllCellars(null, authentication);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());

        verify(cellarService, times(1)).getAllCellarsForUser(VALID_USER_ID);
        verify(cellarService, never()).getAllCellars(anyString());
        verify(authentication, times(2)).getName();
    }

    // ============================================================
    // GET CELLAR BY ID
    // ============================================================

    @Test
    void whenGetCellarById_withoutOwnerCustomerId_thenReturnCellar() {
        when(cellarService.getCellarById(VALID_CELLAR_ID)).thenReturn(validCellarResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.getCellarById(VALID_CELLAR_ID, null);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(VALID_CELLAR_ID, response.getBody().getCellarId());

        verify(cellarService, times(1)).getCellarById(VALID_CELLAR_ID);
        verify(cellarService, never()).getCellarById(anyString(), anyString());
    }

    @Test
    void whenGetCellarById_withOwnerCustomerId_thenReturnOwnedCellar() {
        when(cellarService.getCellarById(VALID_CUSTOMER_ID, VALID_CELLAR_ID)).thenReturn(validCellarResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.getCellarById(VALID_CELLAR_ID, VALID_CUSTOMER_ID);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(VALID_CELLAR_ID, response.getBody().getCellarId());

        verify(cellarService, times(1)).getCellarById(VALID_CUSTOMER_ID, VALID_CELLAR_ID);
        verify(cellarService, never()).getCellarById(anyString());
    }

    @Test
    void whenGetCellarById_withNonExistingId_thenThrowResourceNotFoundException() {
        when(cellarService.getCellarById(NON_EXISTING_CELLAR_ID))
                .thenThrow(new ResourceNotFoundException("Cellar not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> cellarController.getCellarById(NON_EXISTING_CELLAR_ID, null));

        verify(cellarService, times(1)).getCellarById(NON_EXISTING_CELLAR_ID);
    }

    @Test
    void whenGetCellarById_withInvalidId_thenThrowInvalidIdentifierException() {
        when(cellarService.getCellarById(INVALID_CELLAR_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> cellarController.getCellarById(INVALID_CELLAR_ID, null));

        verify(cellarService, times(1)).getCellarById(INVALID_CELLAR_ID);
    }

    // ============================================================
    // CREATE CELLAR
    // ============================================================

    @Test
    void whenCreateCellar_withValidData_thenReturnCreatedCellar() {
        when(cellarService.createCellar(eq(VALID_CUSTOMER_ID), any(CellarRequestModel.class)))
                .thenReturn(validCellarResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.createCellar(validCellarRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Wine Cellar", response.getBody().getName());

        verify(cellarService, times(1))
                .createCellar(eq(VALID_CUSTOMER_ID), any(CellarRequestModel.class));
    }

    @Test
    void whenCreateCellar_withDifferentCellarType_thenReturnCreatedCellar() {
        CellarRequestModel commercialRequest = new CellarRequestModel();
        commercialRequest.setOwnerCustomerId(new CustomerIdentifier(VALID_CUSTOMER_ID));
        commercialRequest.setName("Commercial Cellar");
        commercialRequest.setHeight(3.0);
        commercialRequest.setWidth(4.0);
        commercialRequest.setDepth(3.0);
        commercialRequest.setBottleCapacity(500);
        commercialRequest.setHasCoolingSystem(true);
        commercialRequest.setHasHumidityControl(true);
        commercialRequest.setHasAutoRegulation(true);
        commercialRequest.setCellarType(CellarType.COMMERCIAL);

        CellarResponseModel commercialResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .ownerCustomerId(VALID_CUSTOMER_ID)
                .name("Commercial Cellar")
                .cellarType(CellarType.COMMERCIAL)
                .bottleCapacity(500)
                .isActive(true)
                .build();

        when(cellarService.createCellar(eq(VALID_CUSTOMER_ID), any(CellarRequestModel.class)))
                .thenReturn(commercialResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.createCellar(commercialRequest);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(CellarType.COMMERCIAL, response.getBody().getCellarType());

        verify(cellarService, times(1))
                .createCellar(eq(VALID_CUSTOMER_ID), any(CellarRequestModel.class));
    }

    // ============================================================
    // UPDATE CELLAR
    // ============================================================

    @Test
    void whenUpdateCellar_withValidData_thenReturnUpdatedCellar() {
        CellarRequestModel updateRequest = new CellarRequestModel();
        updateRequest.setOwnerCustomerId(new CustomerIdentifier(VALID_CUSTOMER_ID));
        updateRequest.setName("Updated Cellar");
        updateRequest.setHeight(3.0);
        updateRequest.setWidth(3.5);
        updateRequest.setDepth(2.5);
        updateRequest.setBottleCapacity(200);
        updateRequest.setHasCoolingSystem(true);
        updateRequest.setHasHumidityControl(true);
        updateRequest.setHasAutoRegulation(true);
        updateRequest.setCellarType(CellarType.PRIVATE);

        CellarResponseModel updatedResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .ownerCustomerId(VALID_CUSTOMER_ID)
                .name("Updated Cellar")
                .height(3.0)
                .bottleCapacity(200)
                .isActive(true)
                .build();

        when(cellarService.updateCellar(eq(VALID_CUSTOMER_ID), eq(VALID_CELLAR_ID), any(CellarRequestModel.class)))
                .thenReturn(updatedResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.updateCellar(VALID_CELLAR_ID, updateRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Updated Cellar", response.getBody().getName());

        verify(cellarService, times(1))
                .updateCellar(eq(VALID_CUSTOMER_ID), eq(VALID_CELLAR_ID), any(CellarRequestModel.class));
    }

    @Test
    void whenUpdateCellar_withNonExistingId_thenThrowResourceNotFoundException() {
        when(cellarService.updateCellar(eq(VALID_CUSTOMER_ID), eq(NON_EXISTING_CELLAR_ID), any()))
                .thenThrow(new ResourceNotFoundException("Cellar not found"));

        CellarRequestModel request = new CellarRequestModel();
        request.setOwnerCustomerId(new CustomerIdentifier(VALID_CUSTOMER_ID));

        assertThrows(ResourceNotFoundException.class,
                () -> cellarController.updateCellar(NON_EXISTING_CELLAR_ID, request));

        verify(cellarService, times(1))
                .updateCellar(eq(VALID_CUSTOMER_ID), eq(NON_EXISTING_CELLAR_ID), any());
    }

    @Test
    void whenUpdateCellar_withInvalidId_thenThrowInvalidIdentifierException() {
        when(cellarService.updateCellar(eq(VALID_CUSTOMER_ID), eq(INVALID_CELLAR_ID), any()))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        CellarRequestModel request = new CellarRequestModel();
        request.setOwnerCustomerId(new CustomerIdentifier(VALID_CUSTOMER_ID));

        assertThrows(InvalidIdentifierException.class,
                () -> cellarController.updateCellar(INVALID_CELLAR_ID, request));

        verify(cellarService, times(1))
                .updateCellar(eq(VALID_CUSTOMER_ID), eq(INVALID_CELLAR_ID), any());
    }

    // ============================================================
    // DEACTIVATE CELLAR
    // ============================================================

//     @Test
//     void whenDeactivateCellar_withValidId_thenReturnDeactivatedCellar() {
//         CellarResponseModel deactivatedResponse = CellarResponseModel.builder()
//                 .cellarId(VALID_CELLAR_ID)
//                 .name("Wine Cellar")
//                 .isActive(false)
//                 .build();

//         when(cellarService.deactivateCellar(VALID_CELLAR_ID)).thenReturn(deactivatedResponse);

//         ResponseEntity<CellarResponseModel> response =
//                 cellarController.deactivateCellar(VALID_CELLAR_ID);

//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertNotNull(response.getBody());
//         assertFalse(response.getBody().isActive());

//         verify(cellarService, times(1)).deactivateCellar(VALID_CELLAR_ID);
//     }

//     @Test
//     void whenDeactivateCellar_withInvalidId_thenThrowInvalidIdentifierException() {
//         when(cellarService.deactivateCellar(INVALID_CELLAR_ID))
//                 .thenThrow(new InvalidIdentifierException("Invalid ID"));

//         assertThrows(InvalidIdentifierException.class,
//                 () -> cellarController.deactivateCellar(INVALID_CELLAR_ID));

//         verify(cellarService, times(1)).deactivateCellar(INVALID_CELLAR_ID);
//     }

//     @Test
//     void whenDeactivateCellar_withNonExistingId_thenThrowResourceNotFoundException() {
//         when(cellarService.deactivateCellar(NON_EXISTING_CELLAR_ID))
//                 .thenThrow(new ResourceNotFoundException("Cellar not found"));

//         assertThrows(ResourceNotFoundException.class,
//                 () -> cellarController.deactivateCellar(NON_EXISTING_CELLAR_ID));

//         verify(cellarService, times(1)).deactivateCellar(NON_EXISTING_CELLAR_ID);
//     }

//     @Test
//     void whenDeactivateCellar_alreadyDeactivated_thenThrowInvalidOperationException() {
//         when(cellarService.deactivateCellar(VALID_CELLAR_ID))
//                 .thenThrow(new InvalidOperationException("Cellar already deactivated"));

//         assertThrows(InvalidOperationException.class,
//                 () -> cellarController.deactivateCellar(VALID_CELLAR_ID));

//         verify(cellarService, times(1)).deactivateCellar(VALID_CELLAR_ID);
//     }

    // ============================================================
    // REACTIVATE CELLAR
    // ============================================================

    @Test
    void whenReactivateCellar_withValidId_thenReturnReactivatedCellar() {
        CellarResponseModel reactivatedResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .name("Wine Cellar")
                .isActive(true)
                .build();

        when(cellarService.reactivateCellar(VALID_CELLAR_ID)).thenReturn(reactivatedResponse);

        ResponseEntity<CellarResponseModel> response =
                cellarController.reactivateCellar(VALID_CELLAR_ID);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isActive());

        verify(cellarService, times(1)).reactivateCellar(VALID_CELLAR_ID);
    }

    @Test
    void whenReactivateCellar_withInvalidId_thenThrowInvalidIdentifierException() {
        when(cellarService.reactivateCellar(INVALID_CELLAR_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> cellarController.reactivateCellar(INVALID_CELLAR_ID));

        verify(cellarService, times(1)).reactivateCellar(INVALID_CELLAR_ID);
    }

    @Test
    void whenReactivateCellar_withNonExistingId_thenThrowResourceNotFoundException() {
        when(cellarService.reactivateCellar(NON_EXISTING_CELLAR_ID))
                .thenThrow(new ResourceNotFoundException("Cellar not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> cellarController.reactivateCellar(NON_EXISTING_CELLAR_ID));

        verify(cellarService, times(1)).reactivateCellar(NON_EXISTING_CELLAR_ID);
    }

    @Test
    void whenReactivateCellar_alreadyActive_thenThrowInvalidOperationException() {
        when(cellarService.reactivateCellar(VALID_CELLAR_ID))
                .thenThrow(new InvalidOperationException("Cellar already active"));

        assertThrows(InvalidOperationException.class,
                () -> cellarController.reactivateCellar(VALID_CELLAR_ID));

        verify(cellarService, times(1)).reactivateCellar(VALID_CELLAR_ID);
    }
}
