package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportIdentifier;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportPart;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.ReportResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PartRepository partRepository;
    private final ReportResponseMapper responseMapper;

    // Tax rates
    private static final BigDecimal TPS_RATE = new BigDecimal("0.05"); // 5%
    private static final BigDecimal TVQ_RATE = new BigDecimal("0.09975"); // 9.975%

    public ReportServiceImpl(ReportRepository reportRepository,
                             AppointmentRepository appointmentRepository,
                             EmployeeRepository employeeRepository,
                             PartRepository partRepository,
                             ReportResponseMapper responseMapper) {
        this.reportRepository = reportRepository;
        this.appointmentRepository = appointmentRepository;
        this.employeeRepository = employeeRepository;
        this.partRepository = partRepository;
        this.responseMapper = responseMapper;
    }

    @Override
    @Transactional
    public ReportResponseModel createReport(ReportRequestModel requestModel, String userId, String userRole) {
        // Find the appointment
        Appointment appointment = appointmentRepository
                .findAppointmentByAppointmentIdentifier_AppointmentId(requestModel.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + requestModel.getAppointmentId()));

        // Check if appointment is completed
        if (appointment.getAppointmentStatus() == null || 
            appointment.getAppointmentStatus().getAppointmentStatusType() != AppointmentStatusType.COMPLETED) {
            throw new InvalidOperationException("Can only create reports for completed appointments");
        }

        // Check if report already exists for this appointment
        Report existingReport = reportRepository
                .findReportByAppointment_AppointmentIdentifier_AppointmentId(requestModel.getAppointmentId());
        if (existingReport != null) {
            throw new ResourceAlreadyExistsException("Report already exists for this appointment");
        }

        // Permission check: only the assigned technician or admin can create report
        if ("TECHNICIAN".equals(userRole)) {
            // userId is the auth service user ID, need to find employee by userId
            Employee technician = employeeRepository.findEmployeeByUserId(userId);
            if (technician == null) {
                throw new ResourceNotFoundException("Employee not found for user: " + userId);
            }
            // Compare employee IDs
            if (!technician.getEmployeeIdentifier().getEmployeeId().equals(
                    appointment.getTechnician().getEmployeeIdentifier().getEmployeeId())) {
                throw new InvalidOperationException("You can only create reports for your own appointments");
            }
        }

        // Create report entity
        Report report = new Report();
        report.setReportIdentifier(new ReportIdentifier());
        report.setAppointment(appointment);
        report.setHoursWorked(requestModel.getHoursWorked());
        report.setFrais(requestModel.getFrais());
        report.setFraisDeplacement(requestModel.getFraisDeplacement());

        // Process parts
        List<ReportPart> reportParts = new ArrayList<>();
        if (requestModel.getParts() != null && !requestModel.getParts().isEmpty()) {
            for (ReportRequestModel.ReportPartRequestModel partRequest : requestModel.getParts()) {
                Part part = partRepository.findPartByPartIdentifier_PartId(partRequest.getPartId());
                if (part == null) {
                    throw new ResourceNotFoundException("Part not found: " + partRequest.getPartId());
                }
                if (!part.getAvailable()) {
                    throw new InvalidOperationException("Part is not available: " + part.getName());
                }

                ReportPart reportPart = new ReportPart();
                reportPart.setReport(report);
                reportPart.setPart(part);
                reportPart.setQuantity(partRequest.getQuantity());
                reportPart.setPrice(partRequest.getPrice());
                reportPart.setNotes(partRequest.getNotes());
                reportParts.add(reportPart);
            }
        }
        report.setReportParts(reportParts);

        // Calculate totals
        calculateTotals(report, appointment);

        // Save report
        Report savedReport = reportRepository.save(report);

        return responseMapper.toResponseModel(savedReport);
    }

    @Override
    public ReportResponseModel getReportById(String reportId, String userId, String userRole) {
        Report report = reportRepository.findReportByReportIdentifier_ReportId(reportId);
        
        if (report == null) {
            throw new ResourceNotFoundException("Report not found: " + reportId);
        }

        // Permission check
        validateReportAccess(report, userId, userRole);

        return responseMapper.toResponseModel(report);
    }

    @Override
    public ReportResponseModel getReportByAppointmentId(String appointmentId, String userId, String userRole) {
        Report report = reportRepository
                .findReportByAppointment_AppointmentIdentifier_AppointmentId(appointmentId);
        
        if (report == null) {
            throw new ResourceNotFoundException("No report found for appointment: " + appointmentId);
        }

        // Permission check
        validateReportAccess(report, userId, userRole);

        return responseMapper.toResponseModel(report);
    }

    @Override
    public List<ReportResponseModel> getTechnicianReports(String technicianId, String userId, String userRole) {
        // Permission check: only the technician themselves or admin
        if ("TECHNICIAN".equals(userRole) && !userId.equals(technicianId)) {
            throw new InvalidOperationException("You can only view your own reports");
        }

        List<Report> reports = reportRepository
                .findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId(technicianId);
        
        return responseMapper.toResponseModelList(reports);
    }

    @Override
    public List<ReportResponseModel> getCustomerReports(String customerId, String userId, String userRole) {
        // Permission check: only admin can view all customer reports
        // Customers will access through their appointment details
        if (!"ADMIN".equals(userRole)) {
            throw new InvalidOperationException("Insufficient permissions to view customer reports");
        }

        List<Report> reports = reportRepository
                .findAllByAppointment_Customer_CustomerIdentifier_CustomerId(customerId);
        
        return responseMapper.toResponseModelList(reports);
    }

    @Override
    public List<ReportResponseModel> getAllReports(String userId, String userRole) {
        // Permission check: only admin can view all reports
        if (!"ADMIN".equals(userRole)) {
            throw new InvalidOperationException("Insufficient permissions to view all reports");
        }

        List<Report> reports = reportRepository.findAll();
        
        return responseMapper.toResponseModelList(reports);
    }

    @Override
    @Transactional
    public ReportResponseModel updateReport(String reportId, ReportRequestModel requestModel, String userId, String userRole) {
        Report report = reportRepository.findReportByReportIdentifier_ReportId(reportId);
        
        if (report == null) {
            throw new ResourceNotFoundException("Report not found: " + reportId);
        }

        // Permission check: only the technician who created it or admin
        if ("TECHNICIAN".equals(userRole)) {
            // userId is the auth service user ID, need to find employee by userId
            Employee technician = employeeRepository.findEmployeeByUserId(userId);
            if (technician == null) {
                throw new ResourceNotFoundException("Employee not found for user: " + userId);
            }
            // Compare employee IDs
            if (!technician.getEmployeeIdentifier().getEmployeeId().equals(
                    report.getAppointment().getTechnician().getEmployeeIdentifier().getEmployeeId())) {
                throw new InvalidOperationException("You can only update your own reports");
            }
        }

        // Update basic fields
        report.setHoursWorked(requestModel.getHoursWorked());
        report.setFrais(requestModel.getFrais());
        report.setFraisDeplacement(requestModel.getFraisDeplacement());

        // Update parts - clear existing and add new ones
        report.getReportParts().clear();
        
        if (requestModel.getParts() != null && !requestModel.getParts().isEmpty()) {
            for (ReportRequestModel.ReportPartRequestModel partRequest : requestModel.getParts()) {
                Part part = partRepository.findPartByPartIdentifier_PartId(partRequest.getPartId());
                if (part == null) {
                    throw new ResourceNotFoundException("Part not found: " + partRequest.getPartId());
                }

                ReportPart reportPart = new ReportPart();
                reportPart.setReport(report);
                reportPart.setPart(part);
                reportPart.setQuantity(partRequest.getQuantity());
                reportPart.setPrice(partRequest.getPrice());
                reportPart.setNotes(partRequest.getNotes());
                report.getReportParts().add(reportPart);
            }
        }

        // Recalculate totals
        calculateTotals(report, report.getAppointment());

        // Save updated report
        Report updatedReport = reportRepository.save(report);

        return responseMapper.toResponseModel(updatedReport);
    }

    @Override
    @Transactional
    public void deleteReport(String reportId, String userId, String userRole) {
        Report report = reportRepository.findReportByReportIdentifier_ReportId(reportId);
        
        if (report == null) {
            throw new ResourceNotFoundException("Report not found: " + reportId);
        }

        // Permission check: only admin can delete reports
        if (!"ADMIN".equals(userRole)) {
            throw new InvalidOperationException("Only administrators can delete reports");
        }

        reportRepository.delete(report);
    }

    /**
     * Calculate all totals including taxes
     */
    private void calculateTotals(Report report, Appointment appointment) {
        // Labor cost = hours * hourly rate
        BigDecimal hourlyRate = BigDecimal.valueOf(appointment.getJob().getHourlyRate());
        BigDecimal laborCost = report.getHoursWorked().multiply(hourlyRate);

        // Parts cost = sum of (quantity * price) for all parts
        BigDecimal partsCost = report.getReportParts().stream()
                .map(rp -> rp.getPrice().multiply(BigDecimal.valueOf(rp.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Subtotal = labor + frais + frais de deplacement + parts
        BigDecimal subtotal = laborCost
                .add(report.getFrais())
                .add(report.getFraisDeplacement())
                .add(partsCost);

        // Calculate taxes
        BigDecimal tpsAmount = subtotal.multiply(TPS_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tvqAmount = subtotal.multiply(TVQ_RATE).setScale(2, RoundingMode.HALF_UP);

        // Total = subtotal + taxes
        BigDecimal total = subtotal.add(tpsAmount).add(tvqAmount);

        // Set calculated values
        report.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        report.setTpsAmount(tpsAmount);
        report.setTvqAmount(tvqAmount);
        report.setTotal(total.setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * Validate user has access to view this report
     */
    private void validateReportAccess(Report report, String userId, String userRole) {
        if ("ADMIN".equals(userRole)) {
            return; // Admin can access all reports
        }

        if ("TECHNICIAN".equals(userRole)) {
            // Technician can access their own reports - userId is the auth service user ID
            Employee technician = employeeRepository.findEmployeeByUserId(userId);
            if (technician != null && 
                technician.getEmployeeIdentifier().getEmployeeId().equals(
                    report.getAppointment().getTechnician().getEmployeeIdentifier().getEmployeeId())) {
                return;
            }
        }

        if ("CUSTOMER".equals(userRole)) {
            // Customer can access reports for their appointments
            Customer customer = report.getAppointment().getCustomer();
            if (customer != null && customer.getUserId().equals(userId)) {
                return;
            }
        }

        throw new InvalidOperationException("You don't have permission to access this report");
    }
}
