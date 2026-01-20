package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.BillService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/bills")
public class BillController {
    
    private static final Logger logger = LoggerFactory.getLogger(BillController.class);
    private final BillService billService;
    
    public BillController(BillService billService) {
        this.billService = billService;
    }
    
    /**
     * Get bill by bill ID
     * Customers can only view their own bills, admins can view all
     */
    @GetMapping("/{billId}")
    public ResponseEntity<BillResponseModel> getBillById(
            @PathVariable String billId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Get Bill Request - UserId: {}, Role: {}, BillId: {}", userId, role, billId);
        
        BillResponseModel bill = billService.getBillById(billId, userId, role);
        return ResponseEntity.ok(bill);
    }
    
    /**
     * Get bill by report ID
     * Customers can only view their own bills, admins can view all
     */
    @GetMapping("/report/{reportId}")
    public ResponseEntity<BillResponseModel> getBillByReportId(
            @PathVariable Integer reportId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Get Bill by Report Request - UserId: {}, Role: {}, ReportId: {}", userId, role, reportId);
        
        BillResponseModel bill = billService.getBillByReportId(reportId, userId, role);
        return ResponseEntity.ok(bill);
    }
    
    /**
     * Get bill by appointment ID
     * Customers can only view their own bills, admins can view all
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<BillResponseModel> getBillByAppointmentId(
            @PathVariable String appointmentId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Get Bill by Appointment Request - UserId: {}, Role: {}, AppointmentId: {}", userId, role, appointmentId);
        
        BillResponseModel bill = billService.getBillByAppointmentId(appointmentId, userId, role);
        return ResponseEntity.ok(bill);
    }
    
    /**
     * Get all bills for a customer
     * Customers can only view their own bills, admins can view all
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<BillResponseModel>> getCustomerBills(
            @PathVariable String customerId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Get Customer Bills Request - UserId: {}, Role: {}, CustomerId: {}", userId, role, customerId);
        
        List<BillResponseModel> bills = billService.getCustomerBills(customerId, userId, role);
        return ResponseEntity.ok(bills);
    }
    
    /**
     * Get all bills (admin only)
     */
    @GetMapping
    public ResponseEntity<List<BillResponseModel>> getAllBills(
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Get All Bills Request - UserId: {}, Role: {}", userId, role);
        
        List<BillResponseModel> bills = billService.getAllBills(userId, role);
        return ResponseEntity.ok(bills);
    }
    
    /**
     * Download bill as PDF
     * Customers can download their own bills, admins can download any bill
     */
    @GetMapping(value = "/{billId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadBillPdf(
            @PathVariable String billId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("PDF Download Request - UserId: {}, Role: {}, BillId: {}", userId, role, billId);
        
        byte[] pdf = billService.getBillPdf(billId, userId, role);
        String filename = "bill_" + billId + ".pdf";
        
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
     * Update bill status (mark as paid or unpaid)
     * Admin only
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'TECHNICIAN')")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{billId}/status")
    public ResponseEntity<BillResponseModel> updateBillStatus(
            @PathVariable String billId,
            @RequestParam String status,
            Authentication authentication) {
        
        String userId = authentication.getName();
        String role = extractRole(authentication);
        
        logger.info("Update Bill Status Request - UserId: {}, Role: {}, BillId: {}, Status: {}", userId, role, billId, status);
        
        BillResponseModel updatedBill = billService.updateBillStatus(billId, status, userId, role);
        return ResponseEntity.ok(updatedBill);
    }
    
    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.replace("ROLE_", ""))
                .findFirst()
                .orElse("UNKNOWN");
    }
}
