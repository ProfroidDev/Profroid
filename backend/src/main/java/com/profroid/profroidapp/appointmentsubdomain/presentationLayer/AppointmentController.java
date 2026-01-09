package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.businessLayer.AppointmentService;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;

    public AppointmentController(AppointmentService appointmentService,
                                  CustomerRepository customerRepository,
                                  EmployeeRepository employeeRepository) {
        this.appointmentService = appointmentService;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
    }

    /**
     * Helper to extract user role from Authentication
     */
    private String extractRole(Authentication authentication) {
        if (authentication == null) return null;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5)) // Remove "ROLE_" prefix
                .findFirst()
                .orElse(null);
    }

    /**
     * Get customerId from JWT userId
     */
    private String getCustomerIdFromUserId(String userId) {
        Customer customer = customerRepository.findCustomerByUserId(userId);
        if (customer == null) {
            throw new ResourceNotFoundException("Customer not found for user: " + userId);
        }
        return customer.getCustomerIdentifier().getCustomerId();
    }

    /**
     * Get employeeId from JWT userId
     */
    private String getEmployeeIdFromUserId(String userId) {
        Employee employee = employeeRepository.findEmployeeByUserId(userId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee not found for user: " + userId);
        }
        return employee.getEmployeeIdentifier().getEmployeeId();
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<AppointmentResponseModel>> getMyAppointments(Authentication authentication) {
        String userId = authentication.getName();
        String customerId = getCustomerIdFromUserId(userId);
        List<AppointmentResponseModel> appointments = appointmentService.getCustomerAppointments(customerId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/my-jobs")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<AppointmentResponseModel>> getMyJobs(Authentication authentication) {
        String userId = authentication.getName();
        String employeeId = getEmployeeIdFromUserId(userId);
        List<AppointmentResponseModel> appointments = appointmentService.getTechnicianAppointments(employeeId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get booked time slots for a technician on a specific date.
     * Used by customers to check technician availability when booking appointments.
     * Returns only time slots, not full appointment details for privacy.
     */
    @GetMapping("/technician/{technicianId}/booked-slots")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianBookedSlotsResponseModel> getTechnicianBookedSlots(
            @PathVariable String technicianId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String appointmentId) {
        TechnicianBookedSlotsResponseModel bookedSlots = appointmentService.getTechnicianBookedSlots(technicianId, date, appointmentId);
        return ResponseEntity.ok(bookedSlots);
    }

    /**
     * Get aggregated available time slots across all technicians for a given date.
     * Shows times when at least one technician is available.
     * Used by customers to see overall availability without selecting a technician first.
     * Filters out time slots where the customer already has appointments.
     */
    @GetMapping("/availability/aggregated")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianBookedSlotsResponseModel> getAggregatedAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String jobName,
            @RequestParam(required = false) String appointmentId,
            Authentication authentication) {
        String userId = authentication.getName();
        String userRole = extractRole(authentication);
        TechnicianBookedSlotsResponseModel availability = appointmentService.getAggregatedAvailability(date, jobName, userId, userRole, appointmentId);
        return ResponseEntity.ok(availability);
    }

    @GetMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<AppointmentResponseModel> getAppointmentById(
            @PathVariable String appointmentId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        // Get the appropriate ID based on role
        String entityId;
        if ("CUSTOMER".equals(role)) {
            entityId = getCustomerIdFromUserId(userId);
        } else if ("TECHNICIAN".equals(role)) {
            entityId = getEmployeeIdFromUserId(userId);
        } else {
            // Admin - use userId directly (service will handle)
            entityId = userId;
        }
        
        AppointmentResponseModel appointment = appointmentService.getAppointmentById(appointmentId, entityId, role);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<AppointmentResponseModel> createAppointment(
            @Valid @RequestBody AppointmentRequestModel appointmentRequest,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        // Get the appropriate ID based on role
        String entityId;
        if ("CUSTOMER".equals(role)) {
            entityId = getCustomerIdFromUserId(userId);
        } else if ("TECHNICIAN".equals(role)) {
            entityId = getEmployeeIdFromUserId(userId);
        } else {
            entityId = userId;
        }
        
        AppointmentResponseModel createdAppointment = appointmentService.addAppointment(appointmentRequest, entityId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAppointment);
    }

    @PutMapping("/{appointmentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<AppointmentResponseModel> updateAppointment(
            @PathVariable String appointmentId,
            @Valid @RequestBody AppointmentRequestModel appointmentRequest,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        String entityId;
        if ("CUSTOMER".equals(role)) {
            entityId = getCustomerIdFromUserId(userId);
        } else if ("TECHNICIAN".equals(role)) {
            entityId = getEmployeeIdFromUserId(userId);
        } else {
            entityId = userId;
        }
        
        AppointmentResponseModel updatedAppointment = appointmentService.updateAppointment(appointmentId, appointmentRequest, entityId, role);
        return ResponseEntity.ok(updatedAppointment);
    }

    @PatchMapping("/{appointmentId}/status")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<AppointmentResponseModel> patchAppointmentStatus(
            @PathVariable String appointmentId,
            @Valid @RequestBody AppointmentStatusChangeRequestModel statusRequest,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        String entityId;
        if ("CUSTOMER".equals(role)) {
            entityId = getCustomerIdFromUserId(userId);
        } else if ("TECHNICIAN".equals(role)) {
            entityId = getEmployeeIdFromUserId(userId);
        } else {
            entityId = userId;
        }
        
        AppointmentResponseModel patchedAppointment = appointmentService.patchAppointmentStatus(appointmentId, statusRequest, entityId, role);
        return ResponseEntity.ok(patchedAppointment);
    }
}
