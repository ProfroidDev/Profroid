package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportIdentifier;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportPart;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportRepository;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.ReportResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationPayloadBuilder;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationUtil;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.generators.ReportPdfGenerator;
import com.profroid.profroidapp.utils.generators.BillIdGenerator.BillIdGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.io.InputStream;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportServiceImpl.class);
    
    private final ReportRepository reportRepository;
    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PartRepository partRepository;
    private final ReportResponseMapper responseMapper;
    private final FileService fileService;
    private final StoredFileRepository storedFileRepository;
    private final ReportPdfGenerator reportPdfGenerator;
    private final BillRepository billRepository;
    private final PaymentNotificationUtil paymentNotificationUtil;

    // Tax rates
    private static final BigDecimal TPS_RATE = new BigDecimal("0.05"); // 5%
    private static final BigDecimal TVQ_RATE = new BigDecimal("0.09975"); // 9.975%

    public ReportServiceImpl(ReportRepository reportRepository,
                             AppointmentRepository appointmentRepository,
                             EmployeeRepository employeeRepository,
                             PartRepository partRepository,
                             ReportResponseMapper responseMapper,
                             FileService fileService,
                             StoredFileRepository storedFileRepository,
                             ReportPdfGenerator reportPdfGenerator,
                             BillRepository billRepository,
                             PaymentNotificationUtil paymentNotificationUtil) {
        this.reportRepository = reportRepository;
        this.appointmentRepository = appointmentRepository;
        this.employeeRepository = employeeRepository;
        this.partRepository = partRepository;
        this.responseMapper = responseMapper;
        this.fileService = fileService;
        this.storedFileRepository = storedFileRepository;
        this.reportPdfGenerator = reportPdfGenerator;
        this.billRepository = billRepository;
        this.paymentNotificationUtil = paymentNotificationUtil;
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

        // Create bill for the report
        createBillForReport(savedReport, appointment);

        // Generate and store PDF after creation
        ReportResponseModel response = responseMapper.toResponseModel(savedReport);
        try {
            reportPdfGenerator.generateAndStoreReportPdf(response, fileService);
        } catch (Exception e) {
            // Do not fail report creation if PDF fails; log/continue
        }

        return response;
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

    @Override
    public byte[] getReportPdf(String reportId, String userId, String userRole, String language) {
        Report report = reportRepository.findReportByReportIdentifier_ReportId(reportId);
        if (report == null) {
            throw new ResourceNotFoundException("Report not found: " + reportId);
        }

        // Access check (technician owner or admin)
        validateReportAccess(report, userId, userRole);

        try {
            // Always regenerate PDF to ensure language is respected
            // Delete old cached file if it exists
            var files = storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
                    FileOwnerType.REPORT.name(), reportId, FileCategory.REPORT.name());
            if (!files.isEmpty()) {
                StoredFile oldFile = files.get(0);
                fileService.delete(oldFile.getId());
                storedFileRepository.delete(oldFile);
            }
            
            // Generate on-demand with requested language and store, then return
            ReportResponseModel response = responseMapper.toResponseModel(report);
            StoredFile created = reportPdfGenerator.generateAndStoreReportPdf(response, fileService, language);
            try (InputStream is = fileService.openStream(created)) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch report PDF", e);
        }
    }

    // Convenience overload for backward compatibility
    public byte[] getReportPdf(String reportId, String userId, String userRole) {
        return getReportPdf(reportId, userId, userRole, "en");
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
        logger.info("Validating report access - UserId: {}, UserRole: {}, ReportId: {}", userId, userRole, report.getReportIdentifier().getReportId());
        
        if ("ADMIN".equals(userRole)) {
            logger.info("Access granted: User is ADMIN");
            return; // Admin can access all reports
        }

        if ("TECHNICIAN".equals(userRole)) {
            // Technician can access reports for appointments they're assigned to
            String appointmentTechUserId = report.getAppointment().getTechnician().getUserId();
            String appointmentTechEmployeeId = report.getAppointment().getTechnician().getEmployeeIdentifier().getEmployeeId();
            
            logger.info("Technician permission check - Current userId: {}, Appointment tech userId: {}, Appointment tech employeeId: {}", 
                    userId, appointmentTechUserId, appointmentTechEmployeeId);
            
            // Try to match by direct userId first
            if (appointmentTechUserId != null && appointmentTechUserId.equals(userId)) {
                logger.info("Access granted: Technician userId matches appointment technician");
                return;
            }
            
            // Try to match by employee ID via userId lookup
            Employee technician = employeeRepository.findEmployeeByUserId(userId);
            if (technician != null) {
                String techEmployeeId = technician.getEmployeeIdentifier().getEmployeeId();
                logger.info("Found employee for userId {} with employeeId: {}", userId, techEmployeeId);
                if (techEmployeeId.equals(appointmentTechEmployeeId)) {
                    logger.info("Access granted: Technician employeeId matches");
                    return;
                }
            } else {
                logger.warn("No employee found for userId: {}", userId);
            }
            
            logger.warn("Access denied: Technician {} is not assigned to appointment {}", userId, report.getAppointment().getAppointmentIdentifier().getAppointmentId());
        }

        if ("CUSTOMER".equals(userRole)) {
            // Customer can access reports for their appointments
            Customer customer = report.getAppointment().getCustomer();
            if (customer != null && customer.getUserId().equals(userId)) {
                logger.info("Access granted: Customer owns this appointment");
                return;
            }
            logger.warn("Access denied: Customer does not own this appointment");
        }

        logger.error("Access denied: Invalid role or permission check failed - Role: {}, UserId: {}", userRole, userId);
        throw new InvalidOperationException("You don't have permission to access this report");
    }

    /**
     * Create a bill for a newly created report
     */
    private void createBillForReport(Report report, Appointment appointment) {
        try {
            Bill bill = new Bill();
            bill.setBillId(BillIdGenerator.generateBillId());
            bill.setReport(report);
            bill.setCustomer(appointment.getCustomer());
            bill.setAppointment(appointment);
            bill.setAmount(report.getTotal());
            bill.setStatus(Bill.BillStatus.UNPAID);

            billRepository.save(bill);
            paymentNotificationUtil.sendPaymentDueNotification(
                    PaymentNotificationPayloadBuilder.buildCustomerRecipient(bill),
                    PaymentNotificationPayloadBuilder.buildPaymentDetails(bill)
            );
            logger.info("Bill created successfully with ID: {} for report: {}", bill.getBillId(), report.getReportIdentifier().getReportId());
        } catch (Exception e) {
            logger.error("Error creating bill for report: {}", report.getReportIdentifier().getReportId(), e);
            // Don't fail report creation if bill creation fails
        }
    }
}
