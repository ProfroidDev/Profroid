
package com.profroid.profroidapp.AppointmentTesting.appointmentPresentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentController;
import com.profroid.profroidapp.appointmentsubdomain.businessLayer.AppointmentService;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class AppointmentControllerUnitTest {

    @InjectMocks
    private AppointmentController appointmentController;

    @Mock
    private AppointmentService appointmentService;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private AppointmentResponseModel res1;
    private AppointmentResponseModel res2;

    private static final String CUSTOMER_USER_ID = "user-customer-123";
    private static final String CUSTOMER_ID = "123e4567-e89b-12d3-a456-426614174000";
    private static final String TECHNICIAN_USER_ID = "user-tech-456";
    private static final String TECHNICIAN_ID = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";

    @BeforeEach
    void setup() {
        res1 = AppointmentResponseModel.builder().appointmentId("appt-1").build();
        res2 = AppointmentResponseModel.builder().appointmentId("appt-2").build();
    }

    private Authentication createAuthentication(String userId, String role) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(userId);
        Collection<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + role)
        );
        lenient().doReturn(authorities).when(auth).getAuthorities();
        return auth;
    }

    private void setupCustomerLookup() {
        Customer customer = mock(Customer.class);
        CustomerIdentifier customerIdentifier = mock(CustomerIdentifier.class);
        when(customerIdentifier.getCustomerId()).thenReturn(CUSTOMER_ID);
        when(customer.getCustomerIdentifier()).thenReturn(customerIdentifier);
        when(customerRepository.findCustomerByUserId(CUSTOMER_USER_ID)).thenReturn(customer);
    }

    private void setupEmployeeLookup() {
        Employee employee = mock(Employee.class);
        EmployeeIdentifier employeeIdentifier = mock(EmployeeIdentifier.class);
        when(employeeIdentifier.getEmployeeId()).thenReturn(TECHNICIAN_ID);
        when(employee.getEmployeeIdentifier()).thenReturn(employeeIdentifier);
        when(employeeRepository.findEmployeeByUserId(TECHNICIAN_USER_ID)).thenReturn(employee);
    }

    // ===== GET MY APPOINTMENTS =====
    // [Appointment][Unit Test][Positive] Get my appointments with valid customer role -> returns list
    @Test
    void whenGetMyAppointments_withValidCustomerRole_thenReturnList() {
        setupCustomerLookup();
        Authentication auth = createAuthentication(CUSTOMER_USER_ID, "CUSTOMER");
        when(appointmentService.getCustomerAppointments(CUSTOMER_ID))
            .thenReturn(Arrays.asList(res1, res2));

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyAppointments(auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(appointmentService, times(1)).getCustomerAppointments(CUSTOMER_ID);
    }

    // ===== GET MY JOBS =====
    // [Appointment][Unit Test][Positive] Get my jobs with valid technician role -> returns list
    @Test
    void whenGetMyJobs_withValidTechnicianRole_thenReturnList() {
        setupEmployeeLookup();
        Authentication auth = createAuthentication(TECHNICIAN_USER_ID, "TECHNICIAN");
        when(appointmentService.getTechnicianAppointments(TECHNICIAN_ID))
            .thenReturn(Arrays.asList(res1, res2));

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyJobs(auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(appointmentService, times(1)).getTechnicianAppointments(TECHNICIAN_ID);
    }

    // ===== GET APPOINTMENT BY ID =====
    // [Appointment][Unit Test][Positive] Get appointment by ID with valid customer role -> returns appointment
    @Test
    void whenGetAppointmentById_withCustomerRole_thenReturnAppointment() {
        String appointmentId = "appt-1";
        setupCustomerLookup();
        Authentication auth = createAuthentication(CUSTOMER_USER_ID, "CUSTOMER");
        AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.getAppointmentById(appointmentId, CUSTOMER_ID, "CUSTOMER"))
            .thenReturn(expected);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).getAppointmentById(appointmentId, CUSTOMER_ID, "CUSTOMER");
    }

    // [Appointment][Unit Test][Positive] Get appointment by ID with valid technician role -> returns appointment
    @Test
    void whenGetAppointmentById_withTechnicianRole_thenReturnAppointment() {
        String appointmentId = "appt-2";
        setupEmployeeLookup();
        Authentication auth = createAuthentication(TECHNICIAN_USER_ID, "TECHNICIAN");
        AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.getAppointmentById(appointmentId, TECHNICIAN_ID, "TECHNICIAN"))
            .thenReturn(expected);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).getAppointmentById(appointmentId, TECHNICIAN_ID, "TECHNICIAN");
    }

    // [Appointment][Unit Test][Positive] Get appointment by ID with admin role -> returns appointment
    @Test
    void whenGetAppointmentById_withAdminRole_thenReturnAppointment() {
        String appointmentId = "appt-3";
        String adminUserId = "admin-user-id";
        Authentication auth = createAuthentication(adminUserId, "ADMIN");
        AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.getAppointmentById(appointmentId, adminUserId, "ADMIN"))
            .thenReturn(expected);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).getAppointmentById(appointmentId, adminUserId, "ADMIN");
    }

     // ===== CREATE APPOINTMENT =====
    // [Appointment][Unit Test][Positive] Create appointment with customer role -> returns created appointment
    @Test
    void whenCreateAppointment_withCustomerRole_thenReturnCreatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        setupCustomerLookup();
        Authentication auth = createAuthentication(CUSTOMER_USER_ID, "CUSTOMER");
        AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-3").build();
        when(appointmentService.addAppointment(appointmentRequest, CUSTOMER_ID, "CUSTOMER"))
            .thenReturn(created);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("appt-3", response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).addAppointment(appointmentRequest, CUSTOMER_ID, "CUSTOMER");
    }

    // [Appointment][Unit Test][Positive] Create appointment with technician role -> returns created appointment
    @Test
    void whenCreateAppointment_withTechnicianRole_thenReturnCreatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        setupEmployeeLookup();
        Authentication auth = createAuthentication(TECHNICIAN_USER_ID, "TECHNICIAN");
        AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-12").build();
        when(appointmentService.addAppointment(eq(appointmentRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN")))
            .thenReturn(created);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("appt-12", response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).addAppointment(eq(appointmentRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN"));
    }

    // [Appointment][Unit Test][Positive] Create appointment with admin role -> returns created appointment
    @Test
    void whenCreateAppointment_withAdminRole_thenReturnCreatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String adminUserId = "admin-user-id";
        Authentication auth = createAuthentication(adminUserId, "ADMIN");
        AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-9").build();
        when(appointmentService.addAppointment(eq(appointmentRequest), eq(adminUserId), eq("ADMIN")))
            .thenReturn(created);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("appt-9", response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).addAppointment(eq(appointmentRequest), eq(adminUserId), eq("ADMIN"));
    }

    // ===== UPDATE APPOINTMENT =====
    // [Appointment][Unit Test][Positive] Update appointment with customer role -> returns updated appointment
    @Test
    void whenUpdateAppointment_withCustomerRole_thenReturnUpdatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String appointmentId = "appt-4";
        setupCustomerLookup();
        Authentication auth = createAuthentication(CUSTOMER_USER_ID, "CUSTOMER");
        AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.updateAppointment(appointmentId, appointmentRequest, CUSTOMER_ID, "CUSTOMER"))
            .thenReturn(updated);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).updateAppointment(appointmentId, appointmentRequest, CUSTOMER_ID, "CUSTOMER");
    }

    // [Appointment][Unit Test][Positive] Update appointment with technician role -> returns updated appointment
    @Test
    void whenUpdateAppointment_withTechnicianRole_thenReturnUpdatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String appointmentId = "appt-13";
        setupEmployeeLookup();
        Authentication auth = createAuthentication(TECHNICIAN_USER_ID, "TECHNICIAN");
        AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN")))
            .thenReturn(updated);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN"));
    }

    // [Appointment][Unit Test][Positive] Update appointment with admin role -> returns updated appointment
    @Test
    void whenUpdateAppointment_withAdminRole_thenReturnUpdatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String appointmentId = "appt-10";
        String adminUserId = "admin-user-id";
        Authentication auth = createAuthentication(adminUserId, "ADMIN");
        AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(adminUserId), eq("ADMIN")))
            .thenReturn(updated);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(adminUserId), eq("ADMIN"));
    }

    // ===== PATCH APPOINTMENT STATUS =====
    // [Appointment][Unit Test][Positive] Patch appointment status with customer role -> returns patched appointment
    @Test
    void whenPatchAppointmentStatus_withCustomerRole_thenReturnPatchedAppointment() {
        var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
        String appointmentId = "appt-5";
        setupCustomerLookup();
        Authentication auth = createAuthentication(CUSTOMER_USER_ID, "CUSTOMER");
        AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
        when(appointmentService.patchAppointmentStatus(appointmentId, statusRequest, CUSTOMER_ID, "CUSTOMER"))
            .thenReturn(patched);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("COMPLETED", response.getBody().getStatus());
        verify(appointmentService, times(1)).patchAppointmentStatus(appointmentId, statusRequest, CUSTOMER_ID, "CUSTOMER");
    }

    // [Appointment][Unit Test][Positive] Patch appointment status with technician role -> returns patched appointment
    @Test
    void whenPatchAppointmentStatus_withTechnicianRole_thenReturnPatchedAppointment() {
        var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
        String appointmentId = "appt-14";
        setupEmployeeLookup();
        Authentication auth = createAuthentication(TECHNICIAN_USER_ID, "TECHNICIAN");
        AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
        when(appointmentService.patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN")))
            .thenReturn(patched);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("COMPLETED", response.getBody().getStatus());
        verify(appointmentService, times(1)).patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(TECHNICIAN_ID), eq("TECHNICIAN"));
    }

    // [Appointment][Unit Test][Positive] Patch appointment status with admin role -> returns patched appointment
    @Test
    void whenPatchAppointmentStatus_withAdminRole_thenReturnPatchedAppointment() {
        var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
        String appointmentId = "appt-11";
        String adminUserId = "admin-user-id";
        Authentication auth = createAuthentication(adminUserId, "ADMIN");
        AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
        when(appointmentService.patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(adminUserId), eq("ADMIN")))
            .thenReturn(patched);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, auth);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("COMPLETED", response.getBody().getStatus());
        verify(appointmentService, times(1)).patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(adminUserId), eq("ADMIN"));
    }

    
}
