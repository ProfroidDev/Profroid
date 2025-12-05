package com.profroid.profroidapp.EmployeeTesting.presentationLayer.employeePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer.EmployeeService;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeController;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
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
public class EmployeeControllerUnitTest {

    @InjectMocks
    private EmployeeController employeeController;

    @Mock
    private EmployeeService employeeService;

    private final String VALID_EMPLOYEE_ID = "e89ba5d-4f42-44f3-ad1d-4723841d5402";
    private final String INVALID_EMPLOYEE_ID = "invalid-id";
    private final String NON_EXISTING_EMPLOYEE_ID = "e89ba5d-4f42-44f3-ad1d-4723841d9999";

    private EmployeeRequestModel validEmployeeRequest;
    private EmployeeResponseModel validEmployeeResponse;

    @BeforeEach
    void setUp() {
        // Setup valid phone number
        EmployeePhoneNumber phoneNumber = new EmployeePhoneNumber();
        phoneNumber.setType(EmployeePhoneType.MOBILE);
        phoneNumber.setNumber("514-123-4567");

        // Setup valid address
        EmployeeAddress address = EmployeeAddress.builder()
                .streetAddress("123 Main St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1A 1A1")
                .build();

        // Setup valid role
        EmployeeRole role = new EmployeeRole();
        role.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);

        // Setup valid request model
        validEmployeeRequest = EmployeeRequestModel.builder()
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(Collections.singletonList(phoneNumber))
                .employeeAddress(address)
                .employeeRole(role)
                .build();

        // Setup valid response model
        EmployeeIdentifier identifier = new EmployeeIdentifier(VALID_EMPLOYEE_ID);
        validEmployeeResponse = EmployeeResponseModel.builder()
                .employeeIdentifier(identifier)
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(Collections.singletonList(phoneNumber))
                .employeeAddress(address)
                .employeeRole(role)
                .build();
    }

    // ===== GET ALL EMPLOYEES TESTS =====

    // [Employee-Service][Unit Test][Positive] Get all employees when employees exist -> returns list of employees
    @Test
    void whenGetAllEmployees_withExistingEmployees_thenReturnEmployeeList() {
        // Arrange
        List<EmployeeResponseModel> expectedList = Arrays.asList(validEmployeeResponse, validEmployeeResponse);
        when(employeeService.getAllEmployees()).thenReturn(expectedList);

        // Act
        ResponseEntity<List<EmployeeResponseModel>> response = employeeController.getAllEmployees();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(employeeService, times(1)).getAllEmployees();
    }

    // [Employee-Service][Unit Test][Positive] Get all employees when no employees exist -> returns empty list
    @Test
    void whenGetAllEmployees_withNoEmployees_thenReturnEmptyList() {
        // Arrange
        when(employeeService.getAllEmployees()).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<List<EmployeeResponseModel>> response = employeeController.getAllEmployees();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
        verify(employeeService, times(1)).getAllEmployees();
    }

    // ===== GET EMPLOYEE BY ID TESTS =====

    // [Employee-Service][Unit Test][Positive] Get employee by ID when employee exists -> returns employee
    @Test
    void whenGetEmployeeById_withValidId_thenReturnEmployee() {
        // Arrange
        when(employeeService.getEmployeeById(VALID_EMPLOYEE_ID)).thenReturn(validEmployeeResponse);

        // Act
        ResponseEntity<EmployeeResponseModel> response = employeeController.getEmployeeById(VALID_EMPLOYEE_ID);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(VALID_EMPLOYEE_ID, response.getBody().getEmployeeIdentifier().getEmployeeId());
        assertEquals("John", response.getBody().getFirstName());
        assertEquals("Doe", response.getBody().getLastName());
        verify(employeeService, times(1)).getEmployeeById(VALID_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Get employee by ID when employee does not exist -> throws ResourceNotFoundException
    @Test
    void whenGetEmployeeById_withNonExistingId_thenThrowResourceNotFoundException() {
        // Arrange
        when(employeeService.getEmployeeById(NON_EXISTING_EMPLOYEE_ID))
                .thenThrow(new ResourceNotFoundException("Employee with id " + NON_EXISTING_EMPLOYEE_ID + " not found"));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            employeeController.getEmployeeById(NON_EXISTING_EMPLOYEE_ID);
        });
        verify(employeeService, times(1)).getEmployeeById(NON_EXISTING_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Get employee by ID when ID is invalid -> throws InvalidIdentifierException
    @Test
    void whenGetEmployeeById_withInvalidId_thenThrowInvalidIdentifierException() {
        // Arrange
        when(employeeService.getEmployeeById(INVALID_EMPLOYEE_ID))
                .thenThrow(new InvalidIdentifierException("Employee id=" + INVALID_EMPLOYEE_ID + " is invalid"));

        // Act & Assert
        assertThrows(InvalidIdentifierException.class, () -> {
            employeeController.getEmployeeById(INVALID_EMPLOYEE_ID);
        });
        verify(employeeService, times(1)).getEmployeeById(INVALID_EMPLOYEE_ID);
    }

    // ===== ADD EMPLOYEE TESTS =====

    // [Employee-Service][Unit Test][Positive] Add employee with valid data -> returns created employee
    @Test
    void whenAddEmployee_withValidData_thenReturnCreatedEmployee() {
        // Arrange
        when(employeeService.addEmployee(any(EmployeeRequestModel.class))).thenReturn(validEmployeeResponse);

        // Act
        ResponseEntity<EmployeeResponseModel> response = employeeController.addEmployee(validEmployeeRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("John", response.getBody().getFirstName());
        assertEquals("Doe", response.getBody().getLastName());
        assertEquals("johndoe", response.getBody().getUserId());
        verify(employeeService, times(1)).addEmployee(any(EmployeeRequestModel.class));
    }

    // [Employee-Service][Unit Test][Positive] Add employee with multiple phone numbers -> returns created employee
    @Test
    void whenAddEmployee_withMultiplePhoneNumbers_thenReturnCreatedEmployee() {
        // Arrange
        EmployeePhoneNumber phone1 = new EmployeePhoneNumber();
        phone1.setType(EmployeePhoneType.MOBILE);
        phone1.setNumber("514-123-4567");

        EmployeePhoneNumber phone2 = new EmployeePhoneNumber();
        phone2.setType(EmployeePhoneType.WORK);
        phone2.setNumber("514-987-6543");

        validEmployeeRequest.setPhoneNumbers(Arrays.asList(phone1, phone2));

        EmployeeResponseModel responseWithMultiplePhones = EmployeeResponseModel.builder()
                .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(Arrays.asList(phone1, phone2))
                .employeeAddress(validEmployeeRequest.getEmployeeAddress())
                .employeeRole(validEmployeeRequest.getEmployeeRole())
                .build();

        when(employeeService.addEmployee(any(EmployeeRequestModel.class))).thenReturn(responseWithMultiplePhones);

        // Act
        ResponseEntity<EmployeeResponseModel> response = employeeController.addEmployee(validEmployeeRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getPhoneNumbers().size());
        verify(employeeService, times(1)).addEmployee(any(EmployeeRequestModel.class));
    }

    // ===== UPDATE EMPLOYEE TESTS =====

    // [Employee-Service][Unit Test][Positive] Update employee with valid data -> returns updated employee
    @Test
    void whenUpdateEmployee_withValidData_thenReturnUpdatedEmployee() {
        // Arrange
        EmployeeRequestModel updateRequest = EmployeeRequestModel.builder()
                .firstName("Jane")
                .lastName("Smith")
                .userId("janesmith")
                .phoneNumbers(validEmployeeRequest.getPhoneNumbers())
                .employeeAddress(validEmployeeRequest.getEmployeeAddress())
                .employeeRole(validEmployeeRequest.getEmployeeRole())
                .build();

        EmployeeResponseModel updatedResponse = EmployeeResponseModel.builder()
                .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
                .firstName("Jane")
                .lastName("Smith")
                .userId("janesmith")
                .phoneNumbers(validEmployeeRequest.getPhoneNumbers())
                .employeeAddress(validEmployeeRequest.getEmployeeAddress())
                .employeeRole(validEmployeeRequest.getEmployeeRole())
                .build();

        when(employeeService.updateEmployee(eq(VALID_EMPLOYEE_ID), any(EmployeeRequestModel.class)))
                .thenReturn(updatedResponse);

        // Act
        ResponseEntity<EmployeeResponseModel> response = employeeController.updateEmployee(VALID_EMPLOYEE_ID, updateRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Jane", response.getBody().getFirstName());
        assertEquals("Smith", response.getBody().getLastName());
        assertEquals("janesmith", response.getBody().getUserId());
        assertEquals(VALID_EMPLOYEE_ID, response.getBody().getEmployeeIdentifier().getEmployeeId());
        verify(employeeService, times(1)).updateEmployee(eq(VALID_EMPLOYEE_ID), any(EmployeeRequestModel.class));
    }

    // [Employee-Service][Unit Test][Negative] Update employee when employee does not exist -> throws ResourceNotFoundException
    @Test
    void whenUpdateEmployee_withNonExistingId_thenThrowResourceNotFoundException() {
        // Arrange
        when(employeeService.updateEmployee(eq(NON_EXISTING_EMPLOYEE_ID), any(EmployeeRequestModel.class)))
                .thenThrow(new ResourceNotFoundException("Employee with id " + NON_EXISTING_EMPLOYEE_ID + " not found"));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            employeeController.updateEmployee(NON_EXISTING_EMPLOYEE_ID, validEmployeeRequest);
        });
        verify(employeeService, times(1)).updateEmployee(eq(NON_EXISTING_EMPLOYEE_ID), any(EmployeeRequestModel.class));
    }

    // [Employee-Service][Unit Test][Negative] Update employee when ID is invalid -> throws InvalidIdentifierException
    @Test
    void whenUpdateEmployee_withInvalidId_thenThrowInvalidIdentifierException() {
        // Arrange
        when(employeeService.updateEmployee(eq(INVALID_EMPLOYEE_ID), any(EmployeeRequestModel.class)))
                .thenThrow(new InvalidIdentifierException("Employee id=" + INVALID_EMPLOYEE_ID + " is invalid"));

        // Act & Assert
        assertThrows(InvalidIdentifierException.class, () -> {
            employeeController.updateEmployee(INVALID_EMPLOYEE_ID, validEmployeeRequest);
        });
        verify(employeeService, times(1)).updateEmployee(eq(INVALID_EMPLOYEE_ID), any(EmployeeRequestModel.class));
    }

    // [Employee-Service][Unit Test][Positive] Update employee role -> returns updated employee
    @Test
    void whenUpdateEmployee_withDifferentRole_thenReturnUpdatedEmployee() {
        // Arrange
        EmployeeRole newRole = new EmployeeRole();
        newRole.setEmployeeRoleType(EmployeeRoleType.ADMIN);

        EmployeeRequestModel updateRequest = EmployeeRequestModel.builder()
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(validEmployeeRequest.getPhoneNumbers())
                .employeeAddress(validEmployeeRequest.getEmployeeAddress())
                .employeeRole(newRole)
                .build();

        EmployeeResponseModel updatedResponse = EmployeeResponseModel.builder()
                .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(validEmployeeRequest.getPhoneNumbers())
                .employeeAddress(validEmployeeRequest.getEmployeeAddress())
                .employeeRole(newRole)
                .build();

        when(employeeService.updateEmployee(eq(VALID_EMPLOYEE_ID), any(EmployeeRequestModel.class)))
                .thenReturn(updatedResponse);

        // Act
        ResponseEntity<EmployeeResponseModel> response = employeeController.updateEmployee(VALID_EMPLOYEE_ID, updateRequest);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(EmployeeRoleType.ADMIN, response.getBody().getEmployeeRole().getEmployeeRoleType());
        verify(employeeService, times(1)).updateEmployee(eq(VALID_EMPLOYEE_ID), any(EmployeeRequestModel.class));
    }
}

