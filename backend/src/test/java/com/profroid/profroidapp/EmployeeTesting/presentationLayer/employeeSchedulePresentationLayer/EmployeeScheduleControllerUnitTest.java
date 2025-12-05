package com.profroid.profroidapp.EmployeeTesting.presentationLayer.employeeSchedulePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer.ScheduleService;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleController;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
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
public class EmployeeScheduleControllerUnitTest {

    @InjectMocks
    private EmployeeScheduleController employeeScheduleController;

    @Mock
    private ScheduleService scheduleService;

    private final String VALID_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000000";
    private final String INVALID_EMPLOYEE_ID = "invalid-id";
    private final String NON_EXISTING_EMPLOYEE_ID = "11111111-1111-1111-1111-111111111111";

    private EmployeeScheduleRequestModel req1;
    private EmployeeScheduleRequestModel req2;
    private EmployeeScheduleResponseModel res1;
    private EmployeeScheduleResponseModel res2;

    @BeforeEach
    void setup() {
    req1 = EmployeeScheduleRequestModel.builder().build();
    req2 = EmployeeScheduleRequestModel.builder().build();

    res1 = EmployeeScheduleResponseModel.builder().build();
    res2 = EmployeeScheduleResponseModel.builder().build();
    }

    // ===== GET SCHEDULE =====
    // [Employee-Schedule][Unit Test][Positive] Get schedule for employee -> returns list
    @Test
    void whenGetEmployeeSchedule_withValidId_thenReturnList() {
    when(scheduleService.getEmployeeSchedule(VALID_EMPLOYEE_ID))
        .thenReturn(Arrays.asList(res1, res2));

    ResponseEntity<List<EmployeeScheduleResponseModel>> response = employeeScheduleController.getEmployeeSchedule(VALID_EMPLOYEE_ID);

    assertNotNull(response);
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(2, response.getBody().size());
    verify(scheduleService, times(1)).getEmployeeSchedule(VALID_EMPLOYEE_ID);
    }

    // [Employee-Schedule][Unit Test][Negative] Get schedule with invalid id -> throws InvalidIdentifierException
    @Test
    void whenGetEmployeeSchedule_withInvalidId_thenThrowInvalidIdentifier() {
    when(scheduleService.getEmployeeSchedule(INVALID_EMPLOYEE_ID))
        .thenThrow(new InvalidIdentifierException("Employee ID invalid"));

    assertThrows(InvalidIdentifierException.class,
        () -> employeeScheduleController.getEmployeeSchedule(INVALID_EMPLOYEE_ID));
    verify(scheduleService, times(1)).getEmployeeSchedule(INVALID_EMPLOYEE_ID);
    }

    // [Employee-Schedule][Unit Test][Negative] Get schedule for non-existing employee -> throws ResourceNotFoundException
    @Test
    void whenGetEmployeeSchedule_withNonExistingId_thenThrowNotFound() {
    when(scheduleService.getEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID))
        .thenThrow(new ResourceNotFoundException("Employee not found"));

    assertThrows(ResourceNotFoundException.class,
        () -> employeeScheduleController.getEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID));
    verify(scheduleService, times(1)).getEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID);
    }

    // ===== ADD SCHEDULE =====
    // [Employee-Schedule][Unit Test][Positive] Add schedule for employee -> returns created list
    @Test
    void whenAddEmployeeSchedule_withValidData_thenReturnCreatedList() {
    List<EmployeeScheduleRequestModel> requests = Arrays.asList(req1, req2);
    when(scheduleService.addEmployeeSchedule(eq(VALID_EMPLOYEE_ID), any(List.class)))
        .thenReturn(Arrays.asList(res1, res2));

    ResponseEntity<List<EmployeeScheduleResponseModel>> response = employeeScheduleController.addEmployeeSchedule(VALID_EMPLOYEE_ID, requests);

    assertNotNull(response);
    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertEquals(2, response.getBody().size());
    verify(scheduleService, times(1)).addEmployeeSchedule(eq(VALID_EMPLOYEE_ID), any(List.class));
    }

    // [Employee-Schedule][Unit Test][Negative] Add schedule with invalid id -> throws InvalidIdentifierException
    @Test
    void whenAddEmployeeSchedule_withInvalidId_thenThrowInvalidIdentifier() {
    List<EmployeeScheduleRequestModel> requests = Arrays.asList(req1, req2);
    when(scheduleService.addEmployeeSchedule(eq(INVALID_EMPLOYEE_ID), any(List.class)))
        .thenThrow(new InvalidIdentifierException("Employee ID invalid"));

    assertThrows(InvalidIdentifierException.class,
        () -> employeeScheduleController.addEmployeeSchedule(INVALID_EMPLOYEE_ID, requests));
    verify(scheduleService, times(1)).addEmployeeSchedule(eq(INVALID_EMPLOYEE_ID), any(List.class));
    }

    // ===== UPDATE SCHEDULE =====
    // [Employee-Schedule][Unit Test][Positive] Update schedule for employee -> returns updated list
    @Test
    void whenUpdateEmployeeSchedule_withValidData_thenReturnUpdatedList() {
    List<EmployeeScheduleRequestModel> requests = Collections.singletonList(req1);
    when(scheduleService.updateEmployeeSchedule(eq(VALID_EMPLOYEE_ID), any(List.class)))
        .thenReturn(Collections.singletonList(res1));

    ResponseEntity<List<EmployeeScheduleResponseModel>> response = employeeScheduleController.updateEmployeeSchedule(VALID_EMPLOYEE_ID, requests);

    assertNotNull(response);
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(1, response.getBody().size());
    verify(scheduleService, times(1)).updateEmployeeSchedule(eq(VALID_EMPLOYEE_ID), any(List.class));
    }

    // [Employee-Schedule][Unit Test][Negative] Update schedule for non-existing employee -> throws ResourceNotFoundException
    @Test
    void whenUpdateEmployeeSchedule_withNonExistingId_thenThrowNotFound() {
    List<EmployeeScheduleRequestModel> requests = Collections.singletonList(req2);
    when(scheduleService.updateEmployeeSchedule(eq(NON_EXISTING_EMPLOYEE_ID), any(List.class)))
        .thenThrow(new ResourceNotFoundException("Employee not found"));

    assertThrows(ResourceNotFoundException.class,
        () -> employeeScheduleController.updateEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID, requests));
    verify(scheduleService, times(1)).updateEmployeeSchedule(eq(NON_EXISTING_EMPLOYEE_ID), any(List.class));
    }
    
}
