package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;

import java.util.List;

public interface ReportService {
    
    /**
     * Create a new report for an appointment
     * Only the technician assigned to the appointment or admin can create reports
     */
    ReportResponseModel createReport(ReportRequestModel requestModel, String userId, String userRole);
    
    /**
     * Get report by ID
     * Accessible by technician who created it, the customer, or admin
     */
    ReportResponseModel getReportById(String reportId, String userId, String userRole);
    
    /**
     * Get report by appointment ID
     */
    ReportResponseModel getReportByAppointmentId(String appointmentId, String userId, String userRole);
    
    /**
     * Get all reports for a technician
     * Only accessible by the technician themselves or admin
     */
    List<ReportResponseModel> getTechnicianReports(String technicianId, String userId, String userRole);
    
    /**
     * Get all reports for a customer
     * Only accessible by the customer themselves or admin
     */
    List<ReportResponseModel> getCustomerReports(String customerId, String userId, String userRole);
    
    /**
     * Update an existing report
     * Only the technician who created it or admin can update
     */
    ReportResponseModel updateReport(String reportId, ReportRequestModel requestModel, String userId, String userRole);
    
    /**
     * Delete a report (soft delete by marking appointment as not having a report)
     */
    void deleteReport(String reportId, String userId, String userRole);
}
