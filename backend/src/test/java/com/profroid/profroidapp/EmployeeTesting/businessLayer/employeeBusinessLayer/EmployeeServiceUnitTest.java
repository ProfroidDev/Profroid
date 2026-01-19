package com.profroid.profroidapp.EmployeeTesting.businessLayer.employeeBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer.EmployeeServiceImpl;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceUnitTest {

    @Mock
    private EmployeeRepository employeeRepository;
    @Mock private EmployeeRequestMapper employeeRequestMapper;
    @Mock private EmployeeResponseMapper employeeResponseMapper;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private CustomerRepository customerRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private final String VALID_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000000"; // 36-char UUID
    private final String INVALID_EMPLOYEE_ID = "invalid-id"; // not 36-char UUID
    private final String NON_EXISTING_EMPLOYEE_ID = "11111111-1111-1111-1111-111111111111"; // 36-char UUID not found

    private Employee existingEmployee;
    private EmployeeResponseModel existingEmployeeResponse;
    private EmployeeRequestModel validRequest;

    @BeforeEach
    void setup() {
    existingEmployee = new Employee();
    existingEmployee.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    existingEmployee.setFirstName("John");
    existingEmployee.setLastName("Doe");
    existingEmployee.setUserId("johndoe");
    existingEmployee.setIsActive(true);
    EmployeeRole role = new EmployeeRole();
    role.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
    existingEmployee.setEmployeeRole(role);

    existingEmployeeResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .firstName("John")
        .lastName("Doe")
        .userId("johndoe")
        .employeeRole(role)
        .isActive(true)
        .build();

    validRequest = EmployeeRequestModel.builder()
        .firstName("John")
        .lastName("Doe")
        .userId("johndoe")
        .employeeRole(role)
        .build();
    }

    // [Employee-Service][Unit Test][Positive] Get all employees -> returns list
    @Test
    void getAllEmployees_returnsList() {
    when(employeeRepository.findAll()).thenReturn(Arrays.asList(existingEmployee, existingEmployee));
    when(employeeResponseMapper.toResponseModelList(any(List.class)))
        .thenReturn(Arrays.asList(existingEmployeeResponse, existingEmployeeResponse));

    List<EmployeeResponseModel> result = employeeService.getAllEmployees();
    assertEquals(2, result.size());
    verify(employeeRepository).findAll();
    verify(employeeResponseMapper).toResponseModelList(any(List.class));
    }

    // [Employee-Service][Unit Test][Positive] Get employee by ID (valid) -> returns employee
    @Test
    void getEmployeeById_valid_returnsEmployee() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);
    when(employeeResponseMapper.toResponseModel(any(Employee.class)))
        .thenReturn(existingEmployeeResponse);

    EmployeeResponseModel response = employeeService.getEmployeeById(VALID_EMPLOYEE_ID);
    assertEquals(VALID_EMPLOYEE_ID, response.getEmployeeIdentifier().getEmployeeId());
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Get employee by ID (invalid) -> throws InvalidIdentifierException
    @Test
    void getEmployeeById_invalid_throwsInvalidIdentifier() {
    assertThrows(InvalidIdentifierException.class,
        () -> employeeService.getEmployeeById(INVALID_EMPLOYEE_ID));
    verify(employeeRepository, never()).findEmployeeByEmployeeIdentifier_EmployeeId(anyString());
    }

    // [Employee-Service][Unit Test][Negative] Get employee by ID (not found) -> throws ResourceNotFoundException
    @Test
    void getEmployeeById_notFound_throwsResourceNotFound() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
        .thenReturn(null);
    assertThrows(ResourceNotFoundException.class,
        () -> employeeService.getEmployeeById(NON_EXISTING_EMPLOYEE_ID));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Positive] Add employee with unique userId -> succeeds
    @Test
    void addEmployee_uniqueUserId_succeeds() {
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(null);
    when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(null);

    Employee toEntity = new Employee();
    toEntity.setEmployeeRole(validRequest.getEmployeeRole());
    when(employeeRequestMapper.toEntity(validRequest)).thenReturn(toEntity);

    Employee saved = new Employee();
    saved.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    saved.setFirstName("John");
    saved.setLastName("Doe");
    saved.setUserId("johndoe");
    saved.setEmployeeRole(validRequest.getEmployeeRole());
    saved.setIsActive(true);
    when(employeeRepository.save(any(Employee.class))).thenReturn(saved);

    EmployeeResponseModel expectedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .firstName("John")
        .lastName("Doe")
        .userId("johndoe")
        .employeeRole(validRequest.getEmployeeRole())
        .isActive(true)
        .build();
    when(employeeResponseMapper.toResponseModel(saved)).thenReturn(expectedResponse);

    EmployeeResponseModel response = employeeService.addEmployee(validRequest);
    assertEquals(VALID_EMPLOYEE_ID, response.getEmployeeIdentifier().getEmployeeId());
    assertEquals("johndoe", response.getUserId());
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(customerRepository).findCustomerByUserId("johndoe");
    verify(employeeRequestMapper).toEntity(validRequest);
    verify(employeeRepository).save(any(Employee.class));
    verify(employeeResponseMapper).toResponseModel(saved);
    }

    // [Employee-Service][Unit Test][Negative] Add employee with duplicate userId -> throws ResourceAlreadyExistsException
    @Test
    void addEmployee_duplicateUserId_throwsAlreadyExists() {
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(existingEmployee);
    assertThrows(ResourceAlreadyExistsException.class,
        () -> employeeService.addEmployee(validRequest));
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(employeeRepository, never()).save(any());
    }

    // [Employee-Service][Unit Test][Negative] Add employee when customer has appointments -> throws InvalidOperationException
    @Test
    void addEmployee_customerHasAppointments_throwsInvalidOperation() {
    com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer existingCustomer = 
        mock(com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer.class);
    
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(null);
    when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(existingCustomer);
    
    // Mock customer has 2 appointments
    com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment apt1 = 
        mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment.class);
    com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment apt2 = 
        mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment.class);
    when(appointmentRepository.findAllByCustomer(existingCustomer))
        .thenReturn(Arrays.asList(apt1, apt2));
    
    assertThrows(InvalidOperationException.class,
        () -> employeeService.addEmployee(validRequest));
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(customerRepository).findCustomerByUserId("johndoe");
    verify(appointmentRepository).findAllByCustomer(existingCustomer);
    verify(employeeRepository, never()).save(any());
    verify(customerRepository, never()).delete(any());
    }

    // [Employee-Service][Unit Test][Positive] Add employee when customer has no appointments -> succeeds and deletes customer
    @Test
    void addEmployee_customerExistsNoAppointments_succeeds() {
    com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer existingCustomer = 
        mock(com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer.class);
    
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(null);
    when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(existingCustomer);
    when(appointmentRepository.findAllByCustomer(existingCustomer)).thenReturn(Collections.emptyList());

    Employee toEntity = new Employee();
    toEntity.setEmployeeRole(validRequest.getEmployeeRole());
    when(employeeRequestMapper.toEntity(validRequest)).thenReturn(toEntity);

    Employee saved = new Employee();
    saved.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    saved.setFirstName("John");
    saved.setLastName("Doe");
    saved.setUserId("johndoe");
    saved.setEmployeeRole(validRequest.getEmployeeRole());
    saved.setIsActive(true);
    when(employeeRepository.save(any(Employee.class))).thenReturn(saved);

    EmployeeResponseModel expectedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .firstName("John")
        .lastName("Doe")
        .userId("johndoe")
        .employeeRole(validRequest.getEmployeeRole())
        .isActive(true)
        .build();
    when(employeeResponseMapper.toResponseModel(saved)).thenReturn(expectedResponse);

    EmployeeResponseModel response = employeeService.addEmployee(validRequest);
    assertEquals(VALID_EMPLOYEE_ID, response.getEmployeeIdentifier().getEmployeeId());
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(customerRepository).findCustomerByUserId("johndoe");
    verify(appointmentRepository).findAllByCustomer(existingCustomer);
    verify(customerRepository).delete(existingCustomer);
    verify(employeeRepository).save(any(Employee.class));
    }

    // [Employee-Service][Unit Test][Positive] Reactivate inactive employee when customer has no appointments -> succeeds and deletes customer
    @Test
    void addEmployee_reactivateInactiveEmployeeCustomerNoAppointments_succeeds() {
    Employee inactiveEmployee = new Employee();
    inactiveEmployee.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    inactiveEmployee.setIsActive(false);
    inactiveEmployee.setFirstName("Old");
    inactiveEmployee.setLastName("Name");
    
    com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer existingCustomer = 
        mock(com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer.class);
    
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(inactiveEmployee);
    when(customerRepository.findCustomerByUserId("johndoe")).thenReturn(existingCustomer);
    when(appointmentRepository.findAllByCustomer(existingCustomer)).thenReturn(Collections.emptyList());

    Employee reactivated = new Employee();
    reactivated.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    reactivated.setFirstName("John");
    reactivated.setLastName("Doe");
    reactivated.setUserId("johndoe");
    reactivated.setEmployeeRole(validRequest.getEmployeeRole());
    reactivated.setIsActive(true);
    when(employeeRepository.save(any(Employee.class))).thenReturn(reactivated);

    EmployeeResponseModel reactivatedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .firstName("John")
        .lastName("Doe")
        .userId("johndoe")
        .employeeRole(validRequest.getEmployeeRole())
        .isActive(true)
        .build();
    when(employeeResponseMapper.toResponseModel(reactivated)).thenReturn(reactivatedResponse);

    EmployeeResponseModel response = employeeService.addEmployee(validRequest);
    assertEquals(VALID_EMPLOYEE_ID, response.getEmployeeIdentifier().getEmployeeId());
    assertTrue(response.getIsActive());
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(customerRepository).findCustomerByUserId("johndoe");
    verify(appointmentRepository).findAllByCustomer(existingCustomer);
    verify(customerRepository).delete(existingCustomer);
    verify(employeeRepository).save(any(Employee.class));
    }

    // [Employee-Service][Unit Test][Negative] Update employee with invalid ID -> throws InvalidIdentifierException
    @Test
    void updateEmployee_invalidId_throwsInvalidIdentifier() {
    assertThrows(InvalidIdentifierException.class,
        () -> employeeService.updateEmployee(INVALID_EMPLOYEE_ID, validRequest));
    verify(employeeRepository, never()).findEmployeeByEmployeeIdentifier_EmployeeId(anyString());
    }

    // [Employee-Service][Unit Test][Negative] Update employee with non-existing ID -> throws ResourceNotFoundException
    @Test
    void updateEmployee_notFound_throwsResourceNotFound() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
        .thenReturn(null);
    assertThrows(ResourceNotFoundException.class,
        () -> employeeService.updateEmployee(NON_EXISTING_EMPLOYEE_ID, validRequest));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Update employee with duplicate userId on different employee -> throws ResourceAlreadyExistsException
    @Test
    void updateEmployee_duplicateUserIdOnDifferentEmployee_throwsAlreadyExists() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);
    Employee another = new Employee();
    another.setEmployeeIdentifier(new EmployeeIdentifier("11111111-1111-1111-1111-111111111111"));
    when(employeeRepository.findEmployeeByUserId("johndoe")).thenReturn(another);
    assertThrows(ResourceAlreadyExistsException.class,
        () -> employeeService.updateEmployee(VALID_EMPLOYEE_ID, validRequest));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository).findEmployeeByUserId("johndoe");
    verify(employeeRepository, never()).save(any());
    }

    // [Employee-Service][Unit Test][Negative] Update employee invalid role change (TECHNICIAN <-> non-TECHNICIAN) -> throws InvalidOperationException
    @Test
    void updateEmployee_invalidRoleChange_throwsInvalidOperation() {
    EmployeeRole currentRole = new EmployeeRole();
    currentRole.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
    existingEmployee.setEmployeeRole(currentRole);
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);

    EmployeeRole requestedRole = new EmployeeRole();
    requestedRole.setEmployeeRoleType(EmployeeRoleType.ADMIN);
    validRequest.setEmployeeRole(requestedRole);

    assertThrows(InvalidOperationException.class,
        () -> employeeService.updateEmployee(VALID_EMPLOYEE_ID, validRequest));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository, never()).save(any());
    }

    // [Employee-Service][Unit Test][Positive] Update employee valid non-tech role change -> succeeds
    @Test
    void updateEmployee_validChange_succeeds() {
    EmployeeRole currentRole = new EmployeeRole();
    currentRole.setEmployeeRoleType(EmployeeRoleType.SUPPORT);
    existingEmployee.setEmployeeRole(currentRole);
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);

    EmployeeRole requestedRole = new EmployeeRole();
    requestedRole.setEmployeeRoleType(EmployeeRoleType.SALES);
    EmployeeRequestModel updateRequest = EmployeeRequestModel.builder()
        .firstName("Jane").lastName("Smith").userId("janesmith")
        .employeeRole(requestedRole).build();

    when(employeeRepository.findEmployeeByUserId("janesmith")).thenReturn(null);

    Employee updated = new Employee();
    updated.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    updated.setFirstName("Jane");
    updated.setLastName("Smith");
    updated.setUserId("janesmith");
    updated.setEmployeeRole(requestedRole);
    when(employeeRepository.save(any(Employee.class))).thenReturn(updated);

    EmployeeResponseModel updatedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .firstName("Jane").lastName("Smith").userId("janesmith")
        .employeeRole(requestedRole).build();
    when(employeeResponseMapper.toResponseModel(updated)).thenReturn(updatedResponse);

    EmployeeResponseModel response = employeeService.updateEmployee(VALID_EMPLOYEE_ID, updateRequest);
    assertEquals("janesmith", response.getUserId());
    assertEquals(EmployeeRoleType.SALES, response.getEmployeeRole().getEmployeeRoleType());
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository).findEmployeeByUserId("janesmith");
    verify(employeeRepository).save(any(Employee.class));
    verify(employeeResponseMapper).toResponseModel(updated);
    }

    // [Employee-Service][Unit Test][Positive] Deactivate employee -> succeeds
    @Test
    void deactivateEmployee_valid_succeeds() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);
    when(appointmentRepository.findAllByTechnician(any(Employee.class))).thenReturn(Collections.emptyList());
    
    Employee deactivated = new Employee();
    deactivated.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    deactivated.setIsActive(false);
    when(employeeRepository.save(any(Employee.class))).thenReturn(deactivated);
    
    EmployeeResponseModel deactivatedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .isActive(false)
        .build();
    when(employeeResponseMapper.toResponseModel(deactivated)).thenReturn(deactivatedResponse);

    EmployeeResponseModel response = employeeService.deactivateEmployee(VALID_EMPLOYEE_ID);
    assertFalse(response.getIsActive());
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository).save(any(Employee.class));
    }

    // [Employee-Service][Unit Test][Negative] Deactivate employee with invalid ID -> throws InvalidIdentifierException
    @Test
    void deactivateEmployee_invalidId_throwsInvalidIdentifier() {
    assertThrows(InvalidIdentifierException.class,
        () -> employeeService.deactivateEmployee(INVALID_EMPLOYEE_ID));
    verify(employeeRepository, never()).findEmployeeByEmployeeIdentifier_EmployeeId(anyString());
    }

    // [Employee-Service][Unit Test][Negative] Deactivate employee not found -> throws ResourceNotFoundException
    @Test
    void deactivateEmployee_notFound_throwsResourceNotFound() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
        .thenReturn(null);
    assertThrows(ResourceNotFoundException.class,
        () -> employeeService.deactivateEmployee(NON_EXISTING_EMPLOYEE_ID));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Deactivate already deactivated employee -> throws InvalidOperationException
    @Test
    void deactivateEmployee_alreadyDeactivated_throwsInvalidOperation() {
    existingEmployee.setIsActive(false);
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);
    assertThrows(InvalidOperationException.class,
        () -> employeeService.deactivateEmployee(VALID_EMPLOYEE_ID));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository, never()).save(any());
    }

    // [Employee-Service][Unit Test][Positive] Reactivate employee -> succeeds
    @Test
    void reactivateEmployee_valid_succeeds() {
    existingEmployee.setIsActive(false);
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
        .thenReturn(existingEmployee);
    when(appointmentRepository.findAllByTechnician(any(Employee.class))).thenReturn(Collections.emptyList());
    
    Employee reactivated = new Employee();
    reactivated.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
    reactivated.setIsActive(true);
    when(employeeRepository.save(any(Employee.class))).thenReturn(reactivated);
    
    EmployeeResponseModel reactivatedResponse = EmployeeResponseModel.builder()
        .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
        .isActive(true)
        .build();
    when(employeeResponseMapper.toResponseModel(reactivated)).thenReturn(reactivatedResponse);

    EmployeeResponseModel response = employeeService.reactivateEmployee(VALID_EMPLOYEE_ID);
    assertTrue(response.getIsActive());
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    verify(employeeRepository).save(any(Employee.class));
    }

    // [Employee-Service][Unit Test][Negative] Reactivate employee with invalid ID -> throws InvalidIdentifierException
    @Test
    void reactivateEmployee_invalidId_throwsInvalidIdentifier() {
    assertThrows(InvalidIdentifierException.class,
        () -> employeeService.reactivateEmployee(INVALID_EMPLOYEE_ID));
    verify(employeeRepository, never()).findEmployeeByEmployeeIdentifier_EmployeeId(anyString());
    }

    // [Employee-Service][Unit Test][Negative] Reactivate employee not found -> throws ResourceNotFoundException
    @Test
    void reactivateEmployee_notFound_throwsResourceNotFound() {
    when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
        .thenReturn(null);
    assertThrows(ResourceNotFoundException.class,
        () -> employeeService.reactivateEmployee(NON_EXISTING_EMPLOYEE_ID));
    verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID);
    }

    // [Employee-Service][Unit Test][Negative] Reactivate already active employee -> throws InvalidOperationException
    @Test
    void reactivateEmployee_alreadyActive_throwsInvalidOperation() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(existingEmployee);
        assertThrows(InvalidOperationException.class,
                () -> employeeService.reactivateEmployee(VALID_EMPLOYEE_ID));
        verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
        verify(employeeRepository, never()).save(any());
    }

    // ==================== getEmployeeByUserId TESTS ====================

    @Test
    void getEmployeeByUserId_valid_returnsEmployee() {
        Employee employee = new Employee();
        employee.setUserId("user-123");
        employee.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));

        EmployeeResponseModel response = EmployeeResponseModel.builder()
                .employeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID))
                .userId("user-123")
                .build();

        when(employeeRepository.findEmployeeByUserId("user-123")).thenReturn(employee);
        when(employeeResponseMapper.toResponseModel(employee)).thenReturn(response);

        EmployeeResponseModel result = employeeService.getEmployeeByUserId("user-123");

        assertNotNull(result);
        assertEquals("user-123", result.getUserId());
        verify(employeeRepository).findEmployeeByUserId("user-123");
    }

    @Test
    void getEmployeeByUserId_nullUserId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> employeeService.getEmployeeByUserId(null));
        verify(employeeRepository, never()).findEmployeeByUserId(anyString());
    }

    @Test
    void getEmployeeByUserId_emptyUserId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> employeeService.getEmployeeByUserId(""));
        verify(employeeRepository, never()).findEmployeeByUserId(anyString());
    }

    @Test
    void getEmployeeByUserId_blankUserId_throwsInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> employeeService.getEmployeeByUserId("   "));
        verify(employeeRepository, never()).findEmployeeByUserId(anyString());
    }

    @Test
    void getEmployeeByUserId_notFound_throwsResourceNotFound() {
        when(employeeRepository.findEmployeeByUserId("user-not-exists")).thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> employeeService.getEmployeeByUserId("user-not-exists"));
        verify(employeeRepository).findEmployeeByUserId("user-not-exists");
    }

}
