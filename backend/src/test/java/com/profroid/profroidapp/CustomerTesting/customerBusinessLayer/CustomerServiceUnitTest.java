package com.profroid.profroidapp.CustomerTesting.customerBusinessLayer;


import com.profroid.profroidapp.customersubdomain.businessLayer.CustomerServiceImpl;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerRequestMapper;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerResponseMapper;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomerServiceUnitTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerRequestMapper customerRequestMapper;
    @Mock private CustomerResponseMapper customerResponseMapper;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private final String VALID_CUSTOMER_ID = "00000000-0000-0000-0000-000000000000";
    private final String INVALID_CUSTOMER_ID = "bad-id";
    private final String NON_EXISTING_CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";

    private Customer existingCustomer;
    private CustomerResponseModel existingCustomerResponse;
    private CustomerRequestModel validRequest;

    @BeforeEach
    void setup() {
        existingCustomer = new Customer();
        existingCustomer.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        existingCustomer.setFirstName("John");
        existingCustomer.setLastName("Doe");
        existingCustomer.setUserId("johndoe");
        existingCustomer.setIsActive(true);

        CustomerAddress address = new CustomerAddress();
        address.setStreetAddress("123 Main");
        address.setCity("Montreal");
        address.setProvince("QC");
        address.setCountry("Canada");
        address.setPostalCode("H1H1H1");
        existingCustomer.setCustomerAddress(address);

        existingCustomerResponse = CustomerResponseModel.builder()
                .customerId(new CustomerIdentifier(VALID_CUSTOMER_ID))
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .streetAddress("123 Main")
                .city("Montreal")
                .province("QC")
                .country("Canada")
                .postalCode("H1H1H1")
                .phoneNumbers(new ArrayList<>())
                .isActive(true)
                .build();

        validRequest = CustomerRequestModel.builder()
                .firstName("John")
                .lastName("Doe")
                .streetAddress("123 Main")
                .city("Montreal")
                .province("QC")
                .country("Canada")
                .postalCode("H1H1H1")
                .phoneNumbers(new ArrayList<>())
                .userId("johndoe")
                .build();
    }


    // -------------------------------------------------------------------------
    // GET ALL CUSTOMERS
    // -------------------------------------------------------------------------
    @Test
    void getAllCustomers_returnsList() {
        when(customerRepository.findAll()).thenReturn(Arrays.asList(existingCustomer, existingCustomer));
        when(customerResponseMapper.toResponseModelList(any(List.class)))
                .thenReturn(Arrays.asList(existingCustomerResponse, existingCustomerResponse));

        List<CustomerResponseModel> result = customerService.getAllCustomers();

        assertEquals(2, result.size());
        verify(customerRepository).findAll();
        verify(customerResponseMapper).toResponseModelList(any());
    }

    // -------------------------------------------------------------------------
    // GET CUSTOMER BY ID
    // -------------------------------------------------------------------------
    @Test
    void getCustomerById_valid_returnsCustomer() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);
        when(customerResponseMapper.toResponseModel(existingCustomer))
                .thenReturn(existingCustomerResponse);

        CustomerResponseModel response = customerService.getCustomerById(VALID_CUSTOMER_ID);

        assertEquals(VALID_CUSTOMER_ID, response.getCustomerId().getCustomerId());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
    }

    @Test
    void getCustomerById_invalid_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> customerService.getCustomerById(INVALID_CUSTOMER_ID));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    @Test
    void getCustomerById_notFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> customerService.getCustomerById(NON_EXISTING_CUSTOMER_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    // -------------------------------------------------------------------------
    // CREATE CUSTOMER
    // -------------------------------------------------------------------------
    @Test
    void createCustomer_uniqueUserId_succeeds() {
        when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(null);

        Customer entity = new Customer();
        entity.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        when(customerRequestMapper.toEntity(any(), any(CustomerIdentifier.class)))
                .thenReturn(entity);

        when(customerRepository.save(entity)).thenReturn(entity);
        when(customerResponseMapper.toResponseModel(entity)).thenReturn(existingCustomerResponse);

        CustomerResponseModel result = customerService.createCustomer(validRequest);

        assertEquals(VALID_CUSTOMER_ID, result.getCustomerId().getCustomerId());
        verify(customerRepository).findCustomerByUserId("johndoe");
        verify(customerRepository).save(entity);
    }

    @Test
    void createCustomer_duplicateUserId_throwsAlreadyExists() {
        when(customerRepository.findCustomerByUserId("johndoe"))
                .thenReturn(existingCustomer);

        assertThrows(ResourceAlreadyExistsException.class,
                () -> customerService.createCustomer(validRequest));

        verify(customerRepository).findCustomerByUserId("johndoe");
        verify(customerRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // UPDATE CUSTOMER
    // -------------------------------------------------------------------------
    @Test
    void updateCustomer_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> customerService.updateCustomer(INVALID_CUSTOMER_ID, validRequest));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    @Test
    void updateCustomer_notFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> customerService.updateCustomer(NON_EXISTING_CUSTOMER_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    @Test
    void updateCustomer_duplicateUserIdOnDifferentCustomer_throwsAlreadyExists() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);

        Customer other = new Customer();
        other.setCustomerIdentifier(new CustomerIdentifier("22222222-2222-2222-2222-222222222222"));
        when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(other);

        assertThrows(ResourceAlreadyExistsException.class,
                () -> customerService.updateCustomer(VALID_CUSTOMER_ID, validRequest));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(customerRepository).findCustomerByUserId("johndoe");
        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_valid_succeeds() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);

        when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(existingCustomer);

        Customer updated = new Customer();
        updated.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        updated.setFirstName("John");
        updated.setLastName("Doe");
        updated.setUserId("johndoe");

        when(customerRepository.save(any(Customer.class))).thenReturn(updated);

        CustomerResponseModel responseModel = CustomerResponseModel.builder()
                .customerId(new CustomerIdentifier(VALID_CUSTOMER_ID))
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .streetAddress("123 Main")
                .city("Montreal")
                .province("QC")
                .country("Canada")
                .postalCode("H1H1H1")
                .phoneNumbers(new ArrayList<>())
                .isActive(true)
                .build();


        when(customerResponseMapper.toResponseModel(updated)).thenReturn(responseModel);

        CustomerResponseModel response =
                customerService.updateCustomer(VALID_CUSTOMER_ID, validRequest);

        assertEquals("johndoe", response.getUserId());
        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(customerRepository).save(any());
    }

    // -------------------------------------------------------------------------
    // SOFT DELETE CUSTOMER
    // -------------------------------------------------------------------------
    @Test
    void deleteCustomer_valid_succeeds() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);

        Customer deactivated = new Customer();
        deactivated.setCustomerIdentifier(new CustomerIdentifier(VALID_CUSTOMER_ID));
        deactivated.setIsActive(false);

        when(customerRepository.save(any(Customer.class))).thenReturn(deactivated);

        customerService.deleteCustomer(VALID_CUSTOMER_ID);

        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    void deleteCustomer_invalidId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> customerService.deleteCustomer(INVALID_CUSTOMER_ID));
        verify(customerRepository, never()).findCustomerByCustomerIdentifier_CustomerId(anyString());
    }

    @Test
    void deleteCustomer_notFound_throwsResourceNotFound() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> customerService.deleteCustomer(NON_EXISTING_CUSTOMER_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(NON_EXISTING_CUSTOMER_ID);
    }

    @Test
    void deleteCustomer_alreadyDeactivated_throwsInvalidOperation() {
        existingCustomer.setIsActive(false);
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID))
                .thenReturn(existingCustomer);

        assertThrows(InvalidOperationException.class,
                () -> customerService.deleteCustomer(VALID_CUSTOMER_ID));

        verify(customerRepository).findCustomerByCustomerIdentifier_CustomerId(VALID_CUSTOMER_ID);
        verify(customerRepository, never()).save(any());
    }
}

