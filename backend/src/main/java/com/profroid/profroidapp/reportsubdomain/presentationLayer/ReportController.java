package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.ReportService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/reports")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Download the report PDF (Admin and Technician only)
     */
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @GetMapping(value = "/{reportId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadReportPdf(
            @PathVariable String reportId,
            Authentication authentication) {

        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("PDF Download Request - UserId: {}, Role: {}, ReportId: {}", userId, role, reportId);

        byte[] pdf = reportService.getReportPdf(reportId, userId, role);
        String filename = "report_" + reportId + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(pdf);
    }

    /**
     * Create a new report for a completed appointment
     * Only TECHNICIAN (assigned to appointment) and ADMIN can create reports
     */
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PostMapping
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
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN','CUSTOMER')")
    @GetMapping("/{reportId}")
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
    public ResponseEntity<List<ReportResponseModel>> getCustomerReports(
            @PathVariable String customerId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        List<ReportResponseModel> reports = reportService.getCustomerReports(customerId, userId, role);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get all reports (admin only)
     * Returns all reports in the system
     */
    @GetMapping
    public ResponseEntity<List<ReportResponseModel>> getAllReports(
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        List<ReportResponseModel> reports = reportService.getAllReports(userId, role);
        return ResponseEntity.ok(reports);
    }

    /**
     * Update an existing report
     * Only the technician who created it or admin can update
     */
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PutMapping("/{reportId}")
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
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{reportId}")
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
     * JWT filter adds "ROLE_" prefix, so we extract it
     */
    private String extractRole(Authentication authentication) {
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth != null)
                .findFirst()
                .map(auth -> {
                    // Remove "ROLE_" prefix if present
                    if (auth.startsWith("ROLE_")) {
                        return auth.substring(5);
                    }
                    return auth;
                })
                .orElse("CUSTOMER");
        
        logger.debug("Extracted Role: {} from authorities: {}", role, authentication.getAuthorities());
        return role;
    }
}
