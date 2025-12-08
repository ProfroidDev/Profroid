package com.profroid.profroidapp.CustomerTesting.customerPresentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.businessLayer.CustomerService;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerPhoneNumber;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.PhoneType;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerController;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;

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
public class CustomerControllerUnitTest {

    @InjectMocks
    private CustomerController customerController;

    @Mock
    private CustomerService customerService;

    @Mock
    private CellarService cellarService;

    private final String VALID_CUSTOMER_ID = "c1234567-abcd-4f42-9911-abcdef123456";
    private final String INVALID_CUSTOMER_ID = "invalid-id";
    private final String NON_EXISTING_CUSTOMER_ID = "00000000-abcd-4f42-9999-abcdef999999";

    private CustomerRequestModel validCustomerRequest;
    private CustomerResponseModel validCustomerResponse;

    @BeforeEach
    void setUp() {

        // Phone number
        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.HOME);
        phone.setNumber("438-555-2222");

        // Address
        CustomerAddress address = CustomerAddress.builder()
                .streetAddress("45 Sherbrooke")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3B 1B1")
                .build();

        // Request
        validCustomerRequest = CustomerRequestModel.builder()
                .firstName("Alice")
                .lastName("Martin")
                .userId("alicemartin")
                .phoneNumbers(Collections.singletonList(phone))
                .streetAddress(address.getStreetAddress())
                .city(address.getCity())
                .province(address.getProvince())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .build();

        // Identifier
        String identifier = VALID_CUSTOMER_ID;

        // Response
        validCustomerResponse = CustomerResponseModel.builder()
                .customerId(identifier)
                .firstName("Alice")
                .lastName("Martin")
                .userId("alicemartin")
                .phoneNumbers(Collections.singletonList(phone))
                .streetAddress("999 Rue Sainte-Catherine")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3Z 2Y7")
                .isActive(true)
                .build();
    }

    // ============================================================
    // GET ALL CUSTOMERS
    // ============================================================

    @Test
    void whenGetAllCustomers_withExistingCustomers_thenReturnCustomerList() {
        List<CustomerResponseModel> expectedList =
                Arrays.asList(validCustomerResponse, validCustomerResponse);

        when(customerService.getAllCustomers())
                .thenReturn(expectedList);

        ResponseEntity<List<CustomerResponseModel>> response =
                customerController.getAllCustomers();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());

        verify(customerService, times(1)).getAllCustomers();
    }

    @Test
    void whenGetAllCustomers_withNoCustomers_thenReturnEmptyList() {
        when(customerService.getAllCustomers())
                .thenReturn(Collections.emptyList());

        ResponseEntity<List<CustomerResponseModel>> response =
                customerController.getAllCustomers();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());

        verify(customerService, times(1)).getAllCustomers();
    }

    // ============================================================
    // GET CUSTOMER BY ID
    // ============================================================

    @Test
    void whenGetCustomerById_withValidId_thenReturnCustomer() {
        when(customerService.getCustomerById(VALID_CUSTOMER_ID))
                .thenReturn(validCustomerResponse);

        ResponseEntity<CustomerResponseModel> response =
                customerController.getCustomerById(VALID_CUSTOMER_ID);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(VALID_CUSTOMER_ID,
                response.getBody().getCustomerId());

        verify(customerService, times(1)).getCustomerById(VALID_CUSTOMER_ID);
    }

    @Test
    void whenGetCustomerById_withNonExistingId_thenThrowResourceNotFoundException() {
        when(customerService.getCustomerById(NON_EXISTING_CUSTOMER_ID))
                .thenThrow(new ResourceNotFoundException("Customer not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> customerController.getCustomerById(NON_EXISTING_CUSTOMER_ID));

        verify(customerService, times(1)).getCustomerById(NON_EXISTING_CUSTOMER_ID);
    }

    @Test
    void whenGetCustomerById_withInvalidId_thenThrowInvalidIdentifierException() {
        when(customerService.getCustomerById(INVALID_CUSTOMER_ID))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> customerController.getCustomerById(INVALID_CUSTOMER_ID));

        verify(customerService, times(1)).getCustomerById(INVALID_CUSTOMER_ID);
    }

    // ============================================================
    // CREATE CUSTOMER
    // ============================================================

    @Test
    void whenCreateCustomer_withValidData_thenReturnCreatedCustomer() {
        when(customerService.createCustomer(any(CustomerRequestModel.class)))
                .thenReturn(validCustomerResponse);

        ResponseEntity<CustomerResponseModel> response =
                customerController.createCustomer(validCustomerRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Alice", response.getBody().getFirstName());

        verify(customerService, times(1))
                .createCustomer(any(CustomerRequestModel.class));
    }

    @Test
    void whenCreateCustomer_withMultiplePhoneNumbers_thenReturnCreatedCustomer() {

        CustomerPhoneNumber phone1 = new CustomerPhoneNumber();
        phone1.setType(PhoneType.HOME);
        phone1.setNumber("438-555-1111");

        CustomerPhoneNumber phone2 = new CustomerPhoneNumber();
        phone2.setType(PhoneType.MOBILE);
        phone2.setNumber("438-555-9999");

        validCustomerRequest.setPhoneNumbers(Arrays.asList(phone1, phone2));

        CustomerResponseModel multiPhoneResponse = CustomerResponseModel.builder()
                .customerId(VALID_CUSTOMER_ID)
                .firstName("Alice")
                .lastName("Martin")
                .userId("alicemartin")
                .phoneNumbers(Arrays.asList(phone1, phone2))
                .streetAddress("999 Rue Sainte-Catherine")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3Z 2Y7")
                .isActive(true)
                .build();

        when(customerService.createCustomer(any(CustomerRequestModel.class)))
                .thenReturn(multiPhoneResponse);

        ResponseEntity<CustomerResponseModel> response =
                customerController.createCustomer(validCustomerRequest);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(2, response.getBody().getPhoneNumbers().size());

        verify(customerService, times(1))
                .createCustomer(any(CustomerRequestModel.class));
    }

    // ============================================================
    // UPDATE CUSTOMER
    // ============================================================

    @Test
    void whenUpdateCustomer_withValidData_thenReturnUpdatedCustomer() {

        CustomerRequestModel updateRequest = CustomerRequestModel.builder()
                .firstName("Alicia")
                .lastName("Martinez")
                .userId("alicia999")
                .phoneNumbers(validCustomerRequest.getPhoneNumbers())
                .streetAddress("999 Rue Sainte-Catherine")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3Z 2Y7")
                .build();

        CustomerResponseModel updatedResponse = CustomerResponseModel.builder()
                .customerId(VALID_CUSTOMER_ID)
                .firstName("Alicia")
                .lastName("Martinez")
                .userId("alicia999")
                .phoneNumbers(validCustomerRequest.getPhoneNumbers())
                .streetAddress("999 Rue Sainte-Catherine")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3Z 2Y7")
                .build();

        when(customerService.updateCustomer(eq(VALID_CUSTOMER_ID), any(CustomerRequestModel.class)))
                .thenReturn(updatedResponse);

        ResponseEntity<CustomerResponseModel> response =
                customerController.updateCustomer(VALID_CUSTOMER_ID, updateRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Alicia", response.getBody().getFirstName());

        verify(customerService, times(1))
                .updateCustomer(eq(VALID_CUSTOMER_ID), any(CustomerRequestModel.class));
    }

    @Test
    void whenUpdateCustomer_withNonExistingId_thenThrowResourceNotFoundException() {
        when(customerService.updateCustomer(eq(NON_EXISTING_CUSTOMER_ID), any()))
                .thenThrow(new ResourceNotFoundException("Customer not found"));

        assertThrows(ResourceNotFoundException.class,
                () -> customerController.updateCustomer(NON_EXISTING_CUSTOMER_ID, validCustomerRequest));

        verify(customerService, times(1))
                .updateCustomer(eq(NON_EXISTING_CUSTOMER_ID), any());
    }

    @Test
    void whenUpdateCustomer_withInvalidId_thenThrowInvalidIdentifierException() {
        when(customerService.updateCustomer(eq(INVALID_CUSTOMER_ID), any()))
                .thenThrow(new InvalidIdentifierException("Invalid ID"));

        assertThrows(InvalidIdentifierException.class,
                () -> customerController.updateCustomer(INVALID_CUSTOMER_ID, validCustomerRequest));

        verify(customerService, times(1))
                .updateCustomer(eq(INVALID_CUSTOMER_ID), any());
    }

    // ============================================================
    // DELETE CUSTOMER (SOFT DELETE)
    // ============================================================

    @Test
    void whenDeleteCustomer_withValidId_thenReturn204NoContent() {

        doNothing().when(customerService).deleteCustomer(VALID_CUSTOMER_ID);

        ResponseEntity<Void> response =
                customerController.deleteCustomer(VALID_CUSTOMER_ID);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(customerService, times(1)).deleteCustomer(VALID_CUSTOMER_ID);
    }

    @Test
    void whenDeleteCustomer_withInvalidId_thenThrowInvalidIdentifierException() {

        doThrow(new InvalidIdentifierException("Invalid ID"))
                .when(customerService).deleteCustomer(INVALID_CUSTOMER_ID);

        assertThrows(InvalidIdentifierException.class,
                () -> customerController.deleteCustomer(INVALID_CUSTOMER_ID));

        verify(customerService, times(1)).deleteCustomer(INVALID_CUSTOMER_ID);
    }

    @Test
    void whenDeleteCustomer_withNonExistingId_thenThrowResourceNotFoundException() {

        doThrow(new ResourceNotFoundException("Customer not found"))
                .when(customerService).deleteCustomer(NON_EXISTING_CUSTOMER_ID);

        assertThrows(ResourceNotFoundException.class,
                () -> customerController.deleteCustomer(NON_EXISTING_CUSTOMER_ID));

        verify(customerService, times(1)).deleteCustomer(NON_EXISTING_CUSTOMER_ID);
    }

    // ===== CELLAR ENDPOINT TESTS =====

    //
// [Customer-Service][Unit Test][Positive]
// Get all cellars for a customer with valid customerId -> returns cellar list
//
    @Test
    void whenGetAllCellars_withValidCustomerId_thenReturnCellarList() {
        // Arrange
        CellarResponseModel cellar1 = CellarResponseModel.builder()
                .cellarId("cellar-123")
                .name("Main Cellar")
                .bottleCapacity(150)
                .build();

        CellarResponseModel cellar2 = CellarResponseModel.builder()
                .cellarId("cellar-456")
                .name("Backup Cellar")
                .bottleCapacity(80)
                .build();

        List<CellarResponseModel> expectedList = Arrays.asList(cellar1, cellar2);

        when(cellarService.getAllCellars(VALID_CUSTOMER_ID)).thenReturn(expectedList);

        // Act
        ResponseEntity<List<CellarResponseModel>> response =
                customerController.getAllCellars(VALID_CUSTOMER_ID);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals("Main Cellar", response.getBody().get(0).getName());
        verify(cellarService, times(1)).getAllCellars(VALID_CUSTOMER_ID);
    }

    //
// [Customer-Service][Unit Test][Negative]
// Get all cellars with invalid customerId -> throws InvalidIdentifierException
//
    @Test
    void whenGetAllCellars_withInvalidCustomerId_thenThrowInvalidIdentifierException() {
        // Arrange
        when(cellarService.getAllCellars(INVALID_CUSTOMER_ID))
                .thenThrow(new InvalidIdentifierException(
                        "Customer id=" + INVALID_CUSTOMER_ID + " is invalid"));

        // Act & Assert
        assertThrows(InvalidIdentifierException.class, () -> {
            customerController.getAllCellars(INVALID_CUSTOMER_ID);
        });

        verify(cellarService, times(1)).getAllCellars(INVALID_CUSTOMER_ID);
    }

    //
// [Customer-Service][Unit Test][Negative]
// Get all cellars when customer does not exist -> throws ResourceNotFoundException
//
    @Test
    void whenGetAllCellars_withNonExistingCustomerId_thenThrowResourceNotFoundException() {
        // Arrange
        when(cellarService.getAllCellars(NON_EXISTING_CUSTOMER_ID))
                .thenThrow(new ResourceNotFoundException(
                        "Customer with id " + NON_EXISTING_CUSTOMER_ID + " not found"));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            customerController.getAllCellars(NON_EXISTING_CUSTOMER_ID);
        });

        verify(cellarService, times(1)).getAllCellars(NON_EXISTING_CUSTOMER_ID);
    }

    //
// [Customer-Service][Unit Test][Positive]
// Get cellar by id with valid customerId + cellarId -> returns cellar
//
    @Test
    void whenGetCellarById_withValidIds_thenReturnCellar() {
        // Arrange
        String cellarId = "cellar-123";

        CellarResponseModel expectedCellar = CellarResponseModel.builder()
                .cellarId(cellarId)
                .name("Main Cellar")
                .bottleCapacity(200)
                .build();

        when(cellarService.getCellarById(VALID_CUSTOMER_ID, cellarId))
                .thenReturn(expectedCellar);

        // Act
        ResponseEntity<CellarResponseModel> response =
                customerController.getCellarById(VALID_CUSTOMER_ID, cellarId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(cellarId, response.getBody().getCellarId());
        assertEquals("Main Cellar", response.getBody().getName());

        verify(cellarService, times(1))
                .getCellarById(VALID_CUSTOMER_ID, cellarId);
    }

    //
// [Customer-Service][Unit Test][Negative]
// Get cellar by id with invalid customerId -> throws InvalidIdentifierException
//
    @Test
    void whenGetCellarById_withInvalidCustomerId_thenThrowInvalidIdentifierException() {
        // Arrange
        String cellarId = "cellar-123";

        when(cellarService.getCellarById(INVALID_CUSTOMER_ID, cellarId))
                .thenThrow(new InvalidIdentifierException(
                        "Customer id=" + INVALID_CUSTOMER_ID + " is invalid"));

        // Act & Assert
        assertThrows(InvalidIdentifierException.class, () -> {
            customerController.getCellarById(INVALID_CUSTOMER_ID, cellarId);
        });

        verify(cellarService, times(1))
                .getCellarById(INVALID_CUSTOMER_ID, cellarId);
    }

    //
// [Customer-Service][Unit Test][Negative]
// Get cellar by id when cellar does not exist -> throws ResourceNotFoundException
//
    @Test
    void whenGetCellarById_withNonExistingCellarId_thenThrowResourceNotFoundException() {
        // Arrange
        String nonexistentCellar = "cellar-999";

        when(cellarService.getCellarById(VALID_CUSTOMER_ID, nonexistentCellar))
                .thenThrow(new ResourceNotFoundException(
                        "Cellar " + nonexistentCellar + " not found"));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            customerController.getCellarById(VALID_CUSTOMER_ID, nonexistentCellar);
        });

        verify(cellarService, times(1))
                .getCellarById(VALID_CUSTOMER_ID, nonexistentCellar);
    }

    //
// [Customer-Service][Unit Test][Negative]
// Get cellar by id with invalid cellarId -> throws InvalidIdentifierException
//
    @Test
    void whenGetCellarById_withInvalidCellarId_thenThrowInvalidIdentifierException() {
        // Arrange
        String invalidCellarId = "invalid";

        when(cellarService.getCellarById(VALID_CUSTOMER_ID, invalidCellarId))
                .thenThrow(new InvalidIdentifierException(
                        "Cellar id=" + invalidCellarId + " is invalid"));

        // Act & Assert
        assertThrows(InvalidIdentifierException.class, () -> {
            customerController.getCellarById(VALID_CUSTOMER_ID, invalidCellarId);
        });

        verify(cellarService, times(1))
                .getCellarById(VALID_CUSTOMER_ID, invalidCellarId);
    }

}
