package com.profroid.profroidapp.CellarTesting.cellarBusinessLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarServiceImpl;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.cellarsubdomain.mappingLayer.CellarRequestMapper;
import com.profroid.profroidapp.cellarsubdomain.mappingLayer.CellarResponseMapper;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CellarServiceUnitTest {

    @Mock
    private CellarRepository cellarRepository;
    @Mock
    private CellarResponseMapper cellarResponseMapper;
    @Mock
    private CellarRequestMapper cellarRequestMapper;
    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CellarServiceImpl cellarService;

    private final String VALID_CELLAR_ID = "00000000-0000-0000-0000-000000000000";
    private final String VALID_CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
    private final String INVALID_ID = "invalid-id";
    private final String NON_EXISTING_CELLAR_ID = "22222222-2222-2222-2222-222222222222";
    private final String NON_EXISTING_CUSTOMER_ID = "33333333-3333-3333-3333-333333333333";

    private Cellar existingCellar;
    private CellarResponseModel existingCellarResponse;
    private CellarRequestModel validRequest;
    private Customer existingCustomer;
    private CustomerIdentifier customerIdentifier;

    @BeforeEach
    void setup() {
        customerIdentifier = new CustomerIdentifier(VALID_CUSTOMER_ID);

        existingCustomer = new Customer();
        existingCustomer.setCustomerIdentifier(customerIdentifier);
        existingCustomer.setFirstName("John");
        existingCustomer.setLastName("Doe");

        existingCellar = new Cellar();
        existingCellar.setCellarIdentifier(new CellarIdentifier(VALID_CELLAR_ID));
        existingCellar.setOwnerCustomerIdentifier(customerIdentifier);
        existingCellar.setOwnerCustomer(existingCustomer);
        existingCellar.setName("Wine Cellar");
        existingCellar.setHeight(2.5);
        existingCellar.setWidth(3.0);
        existingCellar.setDepth(2.0);
        existingCellar.setBottleCapacity(100);
        existingCellar.setHasCoolingSystem(true);
        existingCellar.setHasHumidityControl(true);
        existingCellar.setHasAutoRegulation(true);
        existingCellar.setCellarType(CellarType.PRIVATE);
        existingCellar.setIsActive(true);

        existingCellarResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .ownerCustomerId(VALID_CUSTOMER_ID)
                .name("Wine Cellar")
                .height(2.5)
                .width(3.0)
                .depth(2.0)
                .bottleCapacity(100)
                .hasCoolingSystem(true)
                .hasHumidityControl(true)
                .hasAutoRegulation(true)
                .cellarType(CellarType.PRIVATE)
                .isActive(true)   // <-- important
                .build();

        validRequest = new CellarRequestModel();
        validRequest.setOwnerCustomerId(customerIdentifier);
        validRequest.setName("Wine Cellar");
        validRequest.setHeight(2.5);
        validRequest.setWidth(3.0);
        validRequest.setDepth(2.0);
        validRequest.setBottleCapacity(100);
        validRequest.setHasCoolingSystem(true);
        validRequest.setHasHumidityControl(true);
        validRequest.setHasAutoRegulation(true);
        validRequest.setCellarType(CellarType.PRIVATE);
    }

    // [Cellar-Service][Unit Test][Positive] Get all cellars -> returns list
    @Test
    void getAllCellars_returnsList() {
        when(cellarRepository.findAll()).thenReturn(Arrays.asList(existingCellar, existingCellar));
        when(cellarResponseMapper.toResponseModelList(any(List.class)))
                .thenReturn(Arrays.asList(existingCellarResponse, existingCellarResponse));

        List<CellarResponseModel> result = cellarService.getAllCellars();

        assertEquals(2, result.size());
        verify(cellarRepository).findAll();
        verify(cellarResponseMapper).toResponseModelList(any(List.class));
    }

    // [Cellar-Service][Unit Test][Positive] Get cellar by ID (valid) -> returns cellar
    @Test
    void getCellarById_valid_returnsCellar() {
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);
        when(cellarResponseMapper.toResponseModel(any(Cellar.class)))
                .thenReturn(existingCellarResponse);

        CellarResponseModel response = cellarService.getCellarById(VALID_CELLAR_ID);

        assertEquals(VALID_CELLAR_ID, response.getCellarId());
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by ID (invalid) -> throws InvalidIdentifierException
    @Test
    void getCellarById_invalid_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getCellarById(INVALID_ID));
        verify(cellarRepository, never()).findCellarByCellarIdentifier_CellarId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by ID (not found) -> throws ResourceNotFoundException
    @Test
    void getCellarById_notFound_throwsResourceNotFound() {
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.getCellarById(NON_EXISTING_CELLAR_ID));

        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Positive] Get all cellars by customer ID -> returns list
    @Test
    void getAllCellarsByCustomerId_valid_returnsList() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRepository.findByOwnerCustomerIdentifier(customerIdentifier))
                .thenReturn(Arrays.asList(existingCellar));
        when(cellarResponseMapper.toResponseModelList(any(List.class)))
                .thenReturn(Arrays.asList(existingCellarResponse));

        List<CellarResponseModel> result = cellarService.getAllCellars(VALID_CUSTOMER_ID);

        assertEquals(1, result.size());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRepository).findByOwnerCustomerIdentifier(customerIdentifier);
    }

    // [Cellar-Service][Unit Test][Negative] Get all cellars by customer ID (invalid) -> throws InvalidIdentifierException
    @Test
    void getAllCellarsByCustomerId_invalid_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getAllCellars(INVALID_ID));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Get all cellars by customer ID (customer not found) -> throws ResourceNotFoundException
    @Test
    void getAllCellarsByCustomerId_customerNotFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.getAllCellars(NON_EXISTING_CUSTOMER_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    // [Cellar-Service][Unit Test][Positive] Get cellar by customer ID and cellar ID -> returns cellar
    @Test
    void getCellarByCustomerIdAndCellarId_valid_returnsCellar() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);
        when(cellarResponseMapper.toResponseModel(any(Cellar.class)))
                .thenReturn(existingCellarResponse);

        CellarResponseModel response = cellarService.getCellarById(VALID_CUSTOMER_ID, VALID_CELLAR_ID);

        assertEquals(VALID_CELLAR_ID, response.getCellarId());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by customer ID and cellar ID (invalid customer ID) -> throws InvalidIdentifierException
    @Test
    void getCellarByCustomerIdAndCellarId_invalidCustomerId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getCellarById(INVALID_ID, VALID_CELLAR_ID));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by customer ID and cellar ID (invalid cellar ID) -> throws InvalidIdentifierException
    @Test
    void getCellarByCustomerIdAndCellarId_invalidCellarId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getCellarById(VALID_CUSTOMER_ID, INVALID_ID));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by customer ID and cellar ID (customer not found) -> throws ResourceNotFoundException
    @Test
    void getCellarByCustomerIdAndCellarId_customerNotFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.getCellarById(NON_EXISTING_CUSTOMER_ID, VALID_CELLAR_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by customer ID and cellar ID (cellar not found) -> throws ResourceNotFoundException
    @Test
    void getCellarByCustomerIdAndCellarId_cellarNotFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.getCellarById(VALID_CUSTOMER_ID, NON_EXISTING_CELLAR_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Get cellar by customer ID and cellar ID (ownership mismatch) -> throws InvalidOperationException
    @Test
    void getCellarByCustomerIdAndCellarId_ownershipMismatch_throwsInvalidOperation() {
        String differentCustomerId = "44444444-4444-4444-4444-444444444444";
        Customer differentCustomer = new Customer();
        differentCustomer.setCustomerIdentifier(new CustomerIdentifier(differentCustomerId));

        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(differentCustomerId))
                .thenReturn(differentCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);

        assertThrows(InvalidOperationException.class,
                () -> cellarService.getCellarById(differentCustomerId, VALID_CELLAR_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(differentCustomerId);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Positive] Create cellar with valid customer -> succeeds
    @Test
    void createCellar_validCustomer_succeeds() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRequestMapper.toEntity(any(CellarRequestModel.class), any(CellarIdentifier.class)))
                .thenReturn(existingCellar);
        when(cellarRepository.save(any(Cellar.class))).thenReturn(existingCellar);
        when(cellarResponseMapper.toResponseModel(existingCellar)).thenReturn(existingCellarResponse);

        CellarResponseModel response = cellarService.createCellar(VALID_CUSTOMER_ID, validRequest);

        assertEquals(VALID_CELLAR_ID, response.getCellarId());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRequestMapper).toEntity(any(CellarRequestModel.class), any(CellarIdentifier.class));
        verify(cellarRepository).save(any(Cellar.class));
        verify(cellarResponseMapper).toResponseModel(existingCellar);
    }

    // [Cellar-Service][Unit Test][Negative] Create cellar with non-existing customer -> throws EntityNotFoundException
    @Test
    void createCellar_customerNotFound_throwsEntityNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(EntityNotFoundException.class,
                () -> cellarService.createCellar(NON_EXISTING_CUSTOMER_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
        verify(cellarRepository, never()).save(any());
    }

    // [Cellar-Service][Unit Test][Positive] Update cellar with valid data -> succeeds
    @Test
    void updateCellar_validData_succeeds() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);

        CellarRequestModel updateRequest = new CellarRequestModel();
        updateRequest.setOwnerCustomerId(customerIdentifier);
        updateRequest.setName("Updated Cellar");
        updateRequest.setHeight(3.0);
        updateRequest.setWidth(3.5);
        updateRequest.setDepth(2.5);
        updateRequest.setBottleCapacity(150);
        updateRequest.setHasCoolingSystem(true);
        updateRequest.setHasHumidityControl(true);
        updateRequest.setHasAutoRegulation(false);
        updateRequest.setCellarType(CellarType.PRIVATE);

        Cellar updatedCellar = new Cellar();
        updatedCellar.setCellarIdentifier(new CellarIdentifier(VALID_CELLAR_ID));
        updatedCellar.setName("Updated Cellar");
        updatedCellar.setBottleCapacity(150);

        when(cellarRepository.save(any(Cellar.class))).thenReturn(updatedCellar);

        CellarResponseModel updatedResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .name("Updated Cellar")
                .bottleCapacity(150)
                .isActive(true)
                .build();

        when(cellarResponseMapper.toResponseModel(updatedCellar)).thenReturn(updatedResponse);

        CellarResponseModel response = cellarService.updateCellar(VALID_CUSTOMER_ID, VALID_CELLAR_ID, updateRequest);

        assertEquals("Updated Cellar", response.getName());
        assertEquals(150, response.getBottleCapacity());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
        verify(cellarRepository).save(any(Cellar.class));
    }

    // [Cellar-Service][Unit Test][Negative] Update cellar with invalid customer ID -> throws InvalidIdentifierException
    @Test
    void updateCellar_invalidCustomerId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.updateCellar(INVALID_ID, VALID_CELLAR_ID, validRequest));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Update cellar with invalid cellar ID -> throws InvalidIdentifierException
    @Test
    void updateCellar_invalidCellarId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.updateCellar(VALID_CUSTOMER_ID, INVALID_ID, validRequest));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Update cellar with customer not found -> throws ResourceNotFoundException
    @Test
    void updateCellar_customerNotFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.updateCellar(NON_EXISTING_CUSTOMER_ID, VALID_CELLAR_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Update cellar with cellar not found -> throws ResourceNotFoundException
    @Test
    void updateCellar_cellarNotFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.updateCellar(VALID_CUSTOMER_ID, NON_EXISTING_CELLAR_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Update cellar with ownership mismatch -> throws InvalidOperationException
    @Test
    void updateCellar_ownershipMismatch_throwsInvalidOperation() {
        String differentCustomerId = "44444444-4444-4444-4444-444444444444";
        Customer differentCustomer = new Customer();
        differentCustomer.setCustomerIdentifier(new CustomerIdentifier(differentCustomerId));

        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(differentCustomerId))
                .thenReturn(differentCustomer);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);

        assertThrows(InvalidOperationException.class,
                () -> cellarService.updateCellar(differentCustomerId, VALID_CELLAR_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(differentCustomerId);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
        verify(cellarRepository, never()).save(any());
    }

//     // [Cellar-Service][Unit Test][Positive] Deactivate cellar -> succeeds
//     @Test
//     void deactivateCellar_valid_succeeds() {
//         when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
//                 .thenReturn(existingCellar);

//         Cellar deactivated = new Cellar();
//         deactivated.setCellarIdentifier(new CellarIdentifier(VALID_CELLAR_ID));
//         deactivated.setIsActive(false);

//         when(cellarRepository.save(any(Cellar.class))).thenReturn(deactivated);

//         CellarResponseModel deactivatedResponse = CellarResponseModel.builder()
//                 .cellarId(VALID_CELLAR_ID)
//                 .isActive(false)
//                 .build();

//         when(cellarResponseMapper.toResponseModel(deactivated)).thenReturn(deactivatedResponse);

//         CellarResponseModel response = cellarService.deactivateCellar(VALID_CELLAR_ID);

//         // access the boolean field directly (since it's 'public boolean isActive;')
//         assertFalse(response.isActive);
//         verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
//         verify(cellarRepository).save(any(Cellar.class));
//     }

//     // [Cellar-Service][Unit Test][Negative] Deactivate cellar with invalid ID -> throws InvalidIdentifierException
//     @Test
//     void deactivateCellar_invalidId_throwsInvalidIdentifier() {
//         assertThrows(InvalidIdentifierException.class,
//                 () -> cellarService.deactivateCellar(INVALID_ID));
//         verify(cellarRepository, never()).findCellarByCellarIdentifier_CellarId(anyString());
//     }

//     // [Cellar-Service][Unit Test][Negative] Deactivate cellar not found -> throws ResourceNotFoundException
//     @Test
//     void deactivateCellar_notFound_throwsResourceNotFound() {
//         when(cellarRepository.findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID))
//                 .thenReturn(null);

//         assertThrows(ResourceNotFoundException.class,
//                 () -> cellarService.deactivateCellar(NON_EXISTING_CELLAR_ID));

//         verify(cellarRepository).findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID);
//     }

//     // [Cellar-Service][Unit Test][Negative] Deactivate already deactivated cellar -> throws InvalidOperationException
//     @Test
//     void deactivateCellar_alreadyDeactivated_throwsInvalidOperation() {
//         existingCellar.setIsActive(false);
//         when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
//                 .thenReturn(existingCellar);

//         assertThrows(InvalidOperationException.class,
//                 () -> cellarService.deactivateCellar(VALID_CELLAR_ID));

//         verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
//         verify(cellarRepository, never()).save(any());
//     }

    // [Cellar-Service][Unit Test][Positive] Reactivate cellar -> succeeds
    @Test
    void reactivateCellar_valid_succeeds() {
        existingCellar.setIsActive(false);
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);

        Cellar reactivated = new Cellar();
        reactivated.setCellarIdentifier(new CellarIdentifier(VALID_CELLAR_ID));
        reactivated.setIsActive(true);

        when(cellarRepository.save(any(Cellar.class))).thenReturn(reactivated);

        CellarResponseModel reactivatedResponse = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .isActive(true)
                .build();

        when(cellarResponseMapper.toResponseModel(reactivated)).thenReturn(reactivatedResponse);

        CellarResponseModel response = cellarService.reactivateCellar(VALID_CELLAR_ID);

        assertTrue(response.isActive);
        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
        verify(cellarRepository).save(any(Cellar.class));
    }

    // [Cellar-Service][Unit Test][Negative] Reactivate cellar with invalid ID -> throws InvalidIdentifierException
    @Test
    void reactivateCellar_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.reactivateCellar(INVALID_ID));
        verify(cellarRepository, never()).findCellarByCellarIdentifier_CellarId(anyString());
    }

    // [Cellar-Service][Unit Test][Negative] Reactivate cellar not found -> throws ResourceNotFoundException
    @Test
    void reactivateCellar_notFound_throwsResourceNotFound() {
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.reactivateCellar(NON_EXISTING_CELLAR_ID));

        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(NON_EXISTING_CELLAR_ID);
    }

    // [Cellar-Service][Unit Test][Negative] Reactivate already active cellar -> throws InvalidOperationException
    @Test
    void reactivateCellar_alreadyActive_throwsInvalidOperation() {
        when(cellarRepository.findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID))
                .thenReturn(existingCellar);

        assertThrows(InvalidOperationException.class,
                () -> cellarService.reactivateCellar(VALID_CELLAR_ID));

        verify(cellarRepository).findCellarByCellarIdentifier_CellarId(VALID_CELLAR_ID);
        verify(cellarRepository, never()).save(any());
    }

    // ==================== getAllCellarsForUser TESTS ====================

    @Test
    void getAllCellarsForUser_valid_returnsList() {
        String userId = "00000000-0000-0000-0000-000000000001";

        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        customer.setUserId(userId);

        Cellar cellar1 = new Cellar();
        cellar1.setCellarIdentifier(new CellarIdentifier(VALID_CELLAR_ID));
        cellar1.setOwnerCustomer(customer);

        CellarResponseModel response1 = CellarResponseModel.builder()
                .cellarId(VALID_CELLAR_ID)
                .build();

        when(customerRepository.findCustomerByUserId(userId)).thenReturn(customer);
        when(cellarRepository.findByOwnerCustomerIdentifier(customer.getCustomerIdentifier()))
                .thenReturn(List.of(cellar1));
        when(cellarResponseMapper.toResponseModelList(List.of(cellar1)))
                .thenReturn(List.of(response1));

        List<CellarResponseModel> result = cellarService.getAllCellarsForUser(userId);

        assertEquals(1, result.size());
        verify(customerRepository).findCustomerByUserId(userId);
        verify(cellarRepository).findByOwnerCustomerIdentifier(customer.getCustomerIdentifier());
    }

    @Test
    void getAllCellarsForUser_noCellars_returnsEmpty() {
        String userId = "00000000-0000-0000-0000-000000000001";

        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        customer.setUserId(userId);

        when(customerRepository.findCustomerByUserId(userId)).thenReturn(customer);
        when(cellarRepository.findByOwnerCustomerIdentifier(customer.getCustomerIdentifier()))
                .thenReturn(List.of());
        when(cellarResponseMapper.toResponseModelList(List.of()))
                .thenReturn(List.of());

        List<CellarResponseModel> result = cellarService.getAllCellarsForUser(userId);

        assertTrue(result.isEmpty());
        verify(customerRepository).findCustomerByUserId(userId);
    }

    @Test
    void getAllCellarsForUser_invalidUserId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getAllCellarsForUser(INVALID_ID));
        verify(customerRepository, never()).findCustomerByUserId(anyString());
    }

    @Test
    void getAllCellarsForUser_nullUserId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> cellarService.getAllCellarsForUser(null));
        verify(customerRepository, never()).findCustomerByUserId(anyString());
    }

    @Test
    void getAllCellarsForUser_customerNotFound_throwsResourceNotFound() {
        String userId = "00000000-0000-0000-0000-000000000001";

        when(customerRepository.findCustomerByUserId(userId)).thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> cellarService.getAllCellarsForUser(userId));
        verify(customerRepository).findCustomerByUserId(userId);
    }
}
