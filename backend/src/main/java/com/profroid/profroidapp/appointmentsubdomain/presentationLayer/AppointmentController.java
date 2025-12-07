package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.businessLayer.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    

    private static final String DEFAULT_TEST_CUSTOMER_ID = "123e4567-e89b-12d3-a456-426614174000"; // John Doe
    private static final String DEFAULT_TEST_TECHNICIAN_ID = "a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b"; // Bob Williams

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }


    @GetMapping("/my-appointments")
    public ResponseEntity<List<AppointmentResponseModel>> getMyAppointments(
            @RequestHeader(value = "X-Customer-Id", required = false) String customerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Use default test customer if no header provided
        String actualCustomerId = (customerId != null && !customerId.isEmpty()) 
            ? customerId 
            : DEFAULT_TEST_CUSTOMER_ID;
        
        String actualRole = (userRole != null && !userRole.isEmpty()) 
            ? userRole 
            : "CUSTOMER";
        
        // Only CUSTOMER role can access their own appointments
        if (!"CUSTOMER".equals(actualRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<AppointmentResponseModel> appointments = appointmentService.getCustomerAppointments(actualCustomerId);
        return ResponseEntity.ok(appointments);
    }


    @GetMapping("/my-jobs")
    public ResponseEntity<List<AppointmentResponseModel>> getMyJobs(
            @RequestHeader(value = "X-Employee-Id", required = false) String technicianId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Use default test technician if no header provided
        String actualTechnicianId = (technicianId != null && !technicianId.isEmpty()) 
            ? technicianId 
            : DEFAULT_TEST_TECHNICIAN_ID;
        
        String actualRole = (userRole != null && !userRole.isEmpty()) 
            ? userRole 
            : "TECHNICIAN";

        if (!"TECHNICIAN".equals(actualRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<AppointmentResponseModel> appointments = appointmentService.getTechnicianAppointments(actualTechnicianId);
        return ResponseEntity.ok(appointments);
    }

    
    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponseModel> getAppointmentById(
            @PathVariable String appointmentId,
            @RequestHeader(value = "X-Customer-Id", required = false) String customerId,
            @RequestHeader(value = "X-Employee-Id", required = false) String employeeId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
    
        String userId;
        String effectiveRole;
        
        // Priority: explicit headers > role auto-detection > defaults
        if (customerId != null && !customerId.isEmpty()) {
            userId = customerId;
            effectiveRole = "CUSTOMER";
        } else if (employeeId != null && !employeeId.isEmpty()) {
            userId = employeeId;
            effectiveRole = "TECHNICIAN";
        } else if (userRole != null && !userRole.isEmpty()) {
            // Use provided role with default customer
            userId = DEFAULT_TEST_CUSTOMER_ID;
            effectiveRole = userRole;
        } else {
            // Use defaults
            userId = DEFAULT_TEST_CUSTOMER_ID;
            effectiveRole = "CUSTOMER";
        }
        
        AppointmentResponseModel appointment = appointmentService.getAppointmentById(appointmentId, userId, effectiveRole);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponseModel> createAppointment(
            @Valid @RequestBody AppointmentRequestModel appointmentRequest,
            @RequestHeader(value = "X-Customer-Id", required = false) String customerId,
            @RequestHeader(value = "X-Employee-Id", required = false) String employeeId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Determine userId and role
        String userId;
        String effectiveRole;
        
        if (customerId != null && !customerId.isEmpty()) {
            userId = customerId;
            effectiveRole = "CUSTOMER";
        } else if (employeeId != null && !employeeId.isEmpty()) {
            userId = employeeId;
            effectiveRole = (userRole != null && !userRole.isEmpty()) ? userRole : "TECHNICIAN";
        } else if (userRole != null && !userRole.isEmpty()) {
            // Use default based on role
            userId = "CUSTOMER".equals(userRole) ? DEFAULT_TEST_CUSTOMER_ID : DEFAULT_TEST_TECHNICIAN_ID;
            effectiveRole = userRole;
        } else {
            // Default to customer
            userId = DEFAULT_TEST_CUSTOMER_ID;
            effectiveRole = "CUSTOMER";
        }
        
        AppointmentResponseModel createdAppointment = appointmentService.addAppointment(appointmentRequest, userId, effectiveRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAppointment);
    }

        @PutMapping("/{appointmentId}")
        public ResponseEntity<AppointmentResponseModel> updateAppointment(
                @PathVariable String appointmentId,
                @Valid @RequestBody AppointmentRequestModel appointmentRequest,
                @RequestHeader(value = "X-Customer-Id", required = false) String customerId,
                @RequestHeader(value = "X-Employee-Id", required = false) String employeeId,
                @RequestHeader(value = "X-User-Role", required = false) String userRole) {
            String userId;
            String effectiveRole;
            if (customerId != null && !customerId.isEmpty()) {
                userId = customerId;
                effectiveRole = "CUSTOMER";
            } else if (employeeId != null && !employeeId.isEmpty()) {
                userId = employeeId;
                effectiveRole = (userRole != null && !userRole.isEmpty()) ? userRole : "TECHNICIAN";
            } else if (userRole != null && !userRole.isEmpty()) {
                userId = "CUSTOMER".equals(userRole) ? DEFAULT_TEST_CUSTOMER_ID : DEFAULT_TEST_TECHNICIAN_ID;
                effectiveRole = userRole;
            } else {
                userId = DEFAULT_TEST_CUSTOMER_ID;
                effectiveRole = "CUSTOMER";
            }
            AppointmentResponseModel updatedAppointment = appointmentService.updateAppointment(appointmentId, appointmentRequest, userId, effectiveRole);
            return ResponseEntity.ok(updatedAppointment);
        }

        @PatchMapping("/{appointmentId}/status")
        public ResponseEntity<AppointmentResponseModel> patchAppointmentStatus(
                @PathVariable String appointmentId,
                @Valid @RequestBody AppointmentStatusChangeRequestModel statusRequest,
                @RequestHeader(value = "X-Customer-Id", required = false) String customerId,
                @RequestHeader(value = "X-Employee-Id", required = false) String employeeId,
                @RequestHeader(value = "X-User-Role", required = false) String userRole) {
            String userId;
            String effectiveRole;
            if (customerId != null && !customerId.isEmpty()) {
                userId = customerId;
                effectiveRole = "CUSTOMER";
            } else if (employeeId != null && !employeeId.isEmpty()) {
                userId = employeeId;
                effectiveRole = (userRole != null && !userRole.isEmpty()) ? userRole : "TECHNICIAN";
            } else if (userRole != null && !userRole.isEmpty()) {
                userId = "CUSTOMER".equals(userRole) ? DEFAULT_TEST_CUSTOMER_ID : DEFAULT_TEST_TECHNICIAN_ID;
                effectiveRole = userRole;
            } else {
                userId = DEFAULT_TEST_CUSTOMER_ID;
                effectiveRole = "CUSTOMER";
            }
            AppointmentResponseModel patchedAppointment = appointmentService.patchAppointmentStatus(appointmentId, statusRequest, userId, effectiveRole);
            return ResponseEntity.ok(patchedAppointment);
        }
}
