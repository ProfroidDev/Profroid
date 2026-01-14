package com.profroid.profroidapp.reportsubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {
    
    Report findReportByReportIdentifier_ReportId(String reportId);
    
    // Find report by appointment ID
    Report findReportByAppointment_AppointmentIdentifier_AppointmentId(String appointmentId);
    
    // Find all reports for a specific technician
    List<Report> findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId(String technicianId);
    
    // Find all reports for a specific customer
    List<Report> findAllByAppointment_Customer_CustomerIdentifier_CustomerId(String customerId);
}
