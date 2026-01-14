package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Create a new report for a completed appointment
     * Only TECHNICIAN (assigned to appointment) and ADMIN can create reports
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ReportResponseModel> createReport(
            @Valid @RequestBody ReportRequestModel requestModel,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        ReportResponseModel response = reportService.createReport(requestModel, userId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get report by ID
     * Accessible by: technician who created it, customer for their appointment, or admin
     */
    @GetMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ReportResponseModel> getReportById(
            @PathVariable String reportId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        ReportResponseModel response = reportService.getReportById(reportId, userId, role);
        return ResponseEntity.ok(response);
    }

    /**
     * Get report by appointment ID
     * Useful for checking if a report exists for an appointment
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ReportResponseModel> getReportByAppointmentId(
            @PathVariable String appointmentId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        ReportResponseModel response = reportService.getReportByAppointmentId(appointmentId, userId, role);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all reports for a technician
     * Only the technician themselves or admin can access
     */
    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<List<ReportResponseModel>> getTechnicianReports(
            @PathVariable String technicianId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        List<ReportResponseModel> reports = reportService.getTechnicianReports(technicianId, userId, role);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get all reports for a customer
     * Only admin can access this endpoint
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReportResponseModel>> getCustomerReports(
            @PathVariable String customerId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        List<ReportResponseModel> reports = reportService.getCustomerReports(customerId, userId, role);
        return ResponseEntity.ok(reports);
    }

    /**
     * Update an existing report
     * Only the technician who created it or admin can update
     */
    @PutMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<ReportResponseModel> updateReport(
            @PathVariable String reportId,
            @Valid @RequestBody ReportRequestModel requestModel,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        ReportResponseModel response = reportService.updateReport(reportId, requestModel, userId, role);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a report
     * Only admin can delete reports
     */
    @DeleteMapping("/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReport(
            @PathVariable String reportId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        reportService.deleteReport(reportId, userId, role);
        return ResponseEntity.noContent().build();
    }

    /**
     * Helper method to extract role from authentication
     */
    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .findFirst()
                .orElse("CUSTOMER");
    }
}
