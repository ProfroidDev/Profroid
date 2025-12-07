
package com.profroid.profroidapp.AppointmentTesting.appointmentPresentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentController;
import com.profroid.profroidapp.appointmentsubdomain.businessLayer.AppointmentService;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class AppointmentControllerUnitTest {

    @InjectMocks
    private AppointmentController appointmentController;

    @Mock
    private AppointmentService appointmentService;

    private AppointmentResponseModel res1;
    private AppointmentResponseModel res2;

    @BeforeEach
    void setup() {
        res1 = AppointmentResponseModel.builder().appointmentId("appt-1").build();
        res2 = AppointmentResponseModel.builder().appointmentId("appt-2").build();
    }

    // ===== GET MY APPOINTMENTS =====
    // [Appointment][Unit Test][Positive] Get my appointments with valid customer role -> returns list
    @Test
    void whenGetMyAppointments_withValidCustomerRole_thenReturnList() {
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "CUSTOMER";
        when(appointmentService.getCustomerAppointments(customerId))
            .thenReturn(Arrays.asList(res1, res2));

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyAppointments(customerId, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(appointmentService, times(1)).getCustomerAppointments(customerId);
    }

    // [Appointment][Unit Test][Negative] Get my appointments with non-customer role -> returns forbidden
    @Test
    void whenGetMyAppointments_withNonCustomerRole_thenReturnForbidden() {
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "TECHNICIAN";

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyAppointments(customerId, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNull(response.getBody());
        verify(appointmentService, never()).getCustomerAppointments(anyString());
    }

    // ===== GET MY JOBS =====
    // [Appointment][Unit Test][Positive] Get my jobs with valid technician role -> returns list
    @Test
    void whenGetMyJobs_withValidTechnicianRole_thenReturnList() {
        String technicianId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
        String userRole = "TECHNICIAN";
        when(appointmentService.getTechnicianAppointments(technicianId))
            .thenReturn(Arrays.asList(res1, res2));

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyJobs(technicianId, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(appointmentService, times(1)).getTechnicianAppointments(technicianId);
    }

    // [Appointment][Unit Test][Negative] Get my jobs with non-technician role -> returns forbidden
    @Test
    void whenGetMyJobs_withNonTechnicianRole_thenReturnForbidden() {
        String technicianId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
        String userRole = "CUSTOMER";

        ResponseEntity<List<AppointmentResponseModel>> response = appointmentController.getMyJobs(technicianId, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNull(response.getBody());
        verify(appointmentService, never()).getTechnicianAppointments(anyString());
    }

    // ===== GET APPOINTMENT BY ID =====
    // [Appointment][Unit Test][Positive] Get appointment by ID with valid customer header -> returns appointment
    @Test
    void whenGetAppointmentById_withCustomerHeader_thenReturnAppointment() {
        String appointmentId = "appt-1";
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "CUSTOMER";
        AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.getAppointmentById(appointmentId, customerId, "CUSTOMER"))
            .thenReturn(expected);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, customerId, null, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).getAppointmentById(appointmentId, customerId, "CUSTOMER");
    }

        // [Appointment][Unit Test][Positive] Get appointment by ID with valid employee header -> returns appointment
        @Test
        void whenGetAppointmentById_withEmployeeHeader_thenReturnAppointment() {
            String appointmentId = "appt-2";
            String employeeId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            String userRole = "TECHNICIAN";
            AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.getAppointmentById(appointmentId, employeeId, "TECHNICIAN"))
                .thenReturn(expected);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, null, employeeId, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).getAppointmentById(appointmentId, employeeId, "TECHNICIAN");
        }

        // [Appointment][Unit Test][Positive] Get appointment by ID with only userRole CUSTOMER -> returns appointment with default test customer
        @Test
        void whenGetAppointmentById_withOnlyUserRoleCustomer_thenReturnDefaultCustomerAppointment() {
            String appointmentId = "appt-3";
            String userRole = "CUSTOMER";
            String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
            AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.getAppointmentById(appointmentId, defaultCustomerId, "CUSTOMER"))
                .thenReturn(expected);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).getAppointmentById(appointmentId, defaultCustomerId, "CUSTOMER");
        }

        // [Appointment][Unit Test][Positive] Get appointment by ID with only userRole TECHNICIAN -> returns appointment with default test technician
        @Test
        void whenGetAppointmentById_withOnlyUserRoleTechnician_thenReturnDefaultTechnicianAppointment() {
        String appointmentId = "appt-4";
        String userRole = "TECHNICIAN";
        String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
        AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.getAppointmentById(eq(appointmentId), eq(defaultCustomerId), eq("TECHNICIAN")))
            .thenReturn(expected);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, null, null, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).getAppointmentById(eq(appointmentId), eq(defaultCustomerId), eq("TECHNICIAN"));
        }

        // [Appointment][Unit Test][Positive] Get appointment by ID with no headers -> returns appointment with default test customer
        @Test
        void whenGetAppointmentById_withNoHeaders_thenReturnDefaultCustomerAppointment() {
            String appointmentId = "appt-5";
            String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
            AppointmentResponseModel expected = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.getAppointmentById(appointmentId, defaultCustomerId, "CUSTOMER"))
                .thenReturn(expected);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.getAppointmentById(appointmentId, null, null, null);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).getAppointmentById(appointmentId, defaultCustomerId, "CUSTOMER");
        }

     // ===== CREATE APPOINTMENT =====
    // [Appointment][Unit Test][Positive] Create appointment with valid customer header -> returns created appointment
    @Test
    void whenCreateAppointment_withCustomerHeader_thenReturnCreatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "CUSTOMER";
        AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-3").build();
        when(appointmentService.addAppointment(appointmentRequest, customerId, "CUSTOMER"))
            .thenReturn(created);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, customerId, null, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("appt-3", response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).addAppointment(appointmentRequest, customerId, "CUSTOMER");
    }
            // [Appointment][Unit Test][Positive] Create appointment with only employeeId -> returns created appointment with employeeId and TECHNICIAN role
        @Test
        void whenCreateAppointment_withOnlyEmployeeId_thenReturnTechnicianCreatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String employeeId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-12").build();
            when(appointmentService.addAppointment(eq(appointmentRequest), eq(employeeId), eq("TECHNICIAN")))
                .thenReturn(created);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, null, employeeId, null);

            assertNotNull(response);
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("appt-12", response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).addAppointment(eq(appointmentRequest), eq(employeeId), eq("TECHNICIAN"));
        }
        @Test
        void whenCreateAppointment_withOnlyUserRoleCustomer_thenReturnDefaultCustomerCreatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String userRole = "CUSTOMER";
            String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
            AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-9").build();
            when(appointmentService.addAppointment(eq(appointmentRequest), eq(defaultCustomerId), eq("CUSTOMER")))
                .thenReturn(created);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("appt-9", response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).addAppointment(eq(appointmentRequest), eq(defaultCustomerId), eq("CUSTOMER"));
        }

        // [Appointment][Unit Test][Positive] Create appointment with only userRole TECHNICIAN -> returns created appointment with default customer
        @Test
        void whenCreateAppointment_withOnlyUserRoleTechnician_thenReturnDefaultTechnicianCreatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String userRole = "TECHNICIAN";
            String defaultTechnicianId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel created = AppointmentResponseModel.builder().appointmentId("appt-7").build();
            when(appointmentService.addAppointment(eq(appointmentRequest), eq(defaultTechnicianId), eq("TECHNICIAN")))
                .thenReturn(created);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.createAppointment(appointmentRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("appt-7", response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).addAppointment(eq(appointmentRequest), eq(defaultTechnicianId), eq("TECHNICIAN"));
        }

    // ===== UPDATE APPOINTMENT =====
    // [Appointment][Unit Test][Positive] Update appointment with valid customer header -> returns updated appointment
    @Test
    void whenUpdateAppointment_withCustomerHeader_thenReturnUpdatedAppointment() {
        var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
        String appointmentId = "appt-4";
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "CUSTOMER";
        AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
        when(appointmentService.updateAppointment(appointmentId, appointmentRequest, customerId, "CUSTOMER"))
            .thenReturn(updated);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, customerId, null, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(appointmentId, response.getBody().getAppointmentId());
        verify(appointmentService, times(1)).updateAppointment(appointmentId, appointmentRequest, customerId, "CUSTOMER");
    }
            // [Appointment][Unit Test][Positive] Update appointment with only employeeId -> returns updated appointment with employeeId and TECHNICIAN role
        @Test
        void whenUpdateAppointment_withOnlyEmployeeId_thenReturnTechnicianUpdatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String appointmentId = "appt-13";
            String employeeId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(employeeId), eq("TECHNICIAN")))
                .thenReturn(updated);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, null, employeeId, null);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(employeeId), eq("TECHNICIAN"));
        }
        @Test
        void whenUpdateAppointment_withOnlyUserRoleCustomer_thenReturnDefaultCustomerUpdatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String appointmentId = "appt-10";
            String userRole = "CUSTOMER";
            String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
            AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(defaultCustomerId), eq("CUSTOMER")))
                .thenReturn(updated);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(defaultCustomerId), eq("CUSTOMER"));
        }

        // [Appointment][Unit Test][Positive] Update appointment with only userRole TECHNICIAN -> returns updated appointment with default customer
        @Test
        void whenUpdateAppointment_withOnlyUserRoleTechnician_thenReturnDefaultTechnicianUpdatedAppointment() {
            var appointmentRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel.class);
            String appointmentId = "appt-8";
            String userRole = "TECHNICIAN";
            String defaultTechnicianId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel updated = AppointmentResponseModel.builder().appointmentId(appointmentId).build();
            when(appointmentService.updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(defaultTechnicianId), eq("TECHNICIAN")))
                .thenReturn(updated);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.updateAppointment(appointmentId, appointmentRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(appointmentId, response.getBody().getAppointmentId());
            verify(appointmentService, times(1)).updateAppointment(eq(appointmentId), eq(appointmentRequest), eq(defaultTechnicianId), eq("TECHNICIAN"));
        }

    // ===== PATCH APPOINTMENT STATUS =====
    // [Appointment][Unit Test][Positive] Patch appointment status with valid customer header -> returns patched appointment
    @Test
    void whenPatchAppointmentStatus_withCustomerHeader_thenReturnPatchedAppointment() {
        var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
        String appointmentId = "appt-5";
        String customerId = "123e4567-e89b-12d3-a456-426614174000";
        String userRole = "CUSTOMER";
        AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
        when(appointmentService.patchAppointmentStatus(appointmentId, statusRequest, customerId, "CUSTOMER"))
            .thenReturn(patched);

        ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, customerId, null, userRole);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("COMPLETED", response.getBody().getStatus());
        verify(appointmentService, times(1)).patchAppointmentStatus(appointmentId, statusRequest, customerId, "CUSTOMER");
    }
            // [Appointment][Unit Test][Positive] Patch appointment status with only employeeId -> returns patched appointment with employeeId and TECHNICIAN role
        @Test
        void whenPatchAppointmentStatus_withOnlyEmployeeId_thenReturnTechnicianPatchedAppointment() {
            var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
            String appointmentId = "appt-14";
            String employeeId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
            when(appointmentService.patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(employeeId), eq("TECHNICIAN")))
                .thenReturn(patched);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, null, employeeId, null);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("COMPLETED", response.getBody().getStatus());
            verify(appointmentService, times(1)).patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(employeeId), eq("TECHNICIAN"));
        }
        @Test
        void whenPatchAppointmentStatus_withOnlyUserRoleCustomer_thenReturnDefaultCustomerPatchedAppointment() {
            var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
            String appointmentId = "appt-11";
            String userRole = "CUSTOMER";
            String defaultCustomerId = "123e4567-e89b-12d3-a456-426614174000";
            AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
            when(appointmentService.patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(defaultCustomerId), eq("CUSTOMER")))
                .thenReturn(patched);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("COMPLETED", response.getBody().getStatus());
            verify(appointmentService, times(1)).patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(defaultCustomerId), eq("CUSTOMER"));
        }

        // [Appointment][Unit Test][Positive] Patch appointment status with only userRole TECHNICIAN -> returns patched appointment with default customer
        @Test
        void whenPatchAppointmentStatus_withOnlyUserRoleTechnician_thenReturnDefaultTechnicianPatchedAppointment() {
            var statusRequest = mock(com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel.class);
            String appointmentId = "appt-6";
            String userRole = "TECHNICIAN";
            String defaultTechnicianId = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b";
            AppointmentResponseModel patched = AppointmentResponseModel.builder().appointmentId(appointmentId).status("COMPLETED").build();
            when(appointmentService.patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(defaultTechnicianId), eq("TECHNICIAN")))
                .thenReturn(patched);

            ResponseEntity<AppointmentResponseModel> response = appointmentController.patchAppointmentStatus(appointmentId, statusRequest, null, null, userRole);

            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("COMPLETED", response.getBody().getStatus());
            verify(appointmentService, times(1)).patchAppointmentStatus(eq(appointmentId), eq(statusRequest), eq(defaultTechnicianId), eq("TECHNICIAN"));
        }

    
}
