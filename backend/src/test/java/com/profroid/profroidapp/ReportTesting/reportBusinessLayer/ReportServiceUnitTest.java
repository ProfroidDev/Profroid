package com.profroid.profroidapp.ReportTesting.reportBusinessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatus;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.reportsubdomain.businessLayer.ReportServiceImpl;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportIdentifier;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportRepository;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.ReportResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.generators.ReportPdfGenerator;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceUnitTest {

    @Mock private ReportRepository reportRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private PartRepository partRepository;
    @Mock private ReportResponseMapper responseMapper;
    @Mock private FileService fileService;
    @Mock private StoredFileRepository storedFileRepository;
    @Mock private ReportPdfGenerator reportPdfGenerator;
    @Mock private BillRepository billRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private Report report;
    private Appointment appointment;
    private Employee technician;
    private Customer customer;
    private Job job;
    private ReportRequestModel validRequest;
    private ReportResponseModel mockResponse;

    @BeforeEach
    void setup() {
        technician = new Employee();
        technician.setEmployeeIdentifier(new EmployeeIdentifier("EMP-1"));
        technician.setUserId("tech-user");

        customer = new Customer();
        customer.setUserId("cust-user");
        customer.setCustomerIdentifier(new CustomerIdentifier("CUST-1"));

        job = new Job();
        job.setJobIdentifier(new JobIdentifier("JOB-1"));
        job.setHourlyRate(50.0);

        AppointmentStatus status = new AppointmentStatus();
        status.setAppointmentStatusType(AppointmentStatusType.COMPLETED);

        appointment = new Appointment();
        appointment.setAppointmentIdentifier(new AppointmentIdentifier("APPT-1"));
        appointment.setTechnician(technician);
        appointment.setCustomer(customer);
        appointment.setJob(job);
        appointment.setAppointmentStatus(status);

        report = new Report();
        report.setReportIdentifier(new ReportIdentifier("REP-123"));
        report.setAppointment(appointment);
        report.setHoursWorked(BigDecimal.valueOf(2.0));
        report.setFrais(BigDecimal.TEN);
        report.setFraisDeplacement(BigDecimal.valueOf(5.0));
        report.setReportParts(new ArrayList<>());

        validRequest = ReportRequestModel.builder()
                .appointmentId("APPT-1")
                .hoursWorked(BigDecimal.valueOf(2.0))
                .frais(BigDecimal.TEN)
                .fraisDeplacement(BigDecimal.valueOf(5.0))
                .parts(new ArrayList<>())
                .build();

        mockResponse = ReportResponseModel.builder()
                .reportId("REP-123")
                .appointmentId("APPT-1")
                .build();
    }

    @Test
    void getAllReports_nonAdmin_throwsInvalidOperation() {
        assertThrows(InvalidOperationException.class,
                () -> reportService.getAllReports("user-1", "CUSTOMER"));
        verify(reportRepository, never()).findAll();
    }

//    @Test
//    void getReportPdf_existingStoredFile_admin_returnsBytes() throws Exception {
//        when(reportRepository.findReportByReportIdentifier_ReportId(eq("REP-123")))
//                .thenReturn(report);
//
//        StoredFile stored = new StoredFile();
//        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                eq(FileOwnerType.REPORT.name()), eq("REP-123"), eq(FileCategory.REPORT.name())))
//                .thenReturn(List.of(stored));
//
//        when(fileService.openStream(eq(stored)))
//                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
//
//        byte[] result = reportService.getReportPdf("REP-123", "admin", "ADMIN");
//        assertArrayEquals(new byte[]{1, 2, 3}, result);
//        verify(storedFileRepository).findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name());
//    }

    @Test
    void updateReport_technicianNotOwner_throwsInvalidOperation() {
        when(reportRepository.findReportByReportIdentifier_ReportId(eq("REP-123")))
                .thenReturn(report);

        // employee lookup returns a different employee id than appointment technician
        Employee otherTech = new Employee();
        otherTech.setEmployeeIdentifier(new EmployeeIdentifier("EMP-999"));
        when(employeeRepository.findEmployeeByUserId(eq("tech-other-user")))
                .thenReturn(otherTech);

        assertThrows(InvalidOperationException.class,
                () -> reportService.updateReport("REP-123", null, "tech-other-user", "TECHNICIAN"));
        verify(reportRepository).findReportByReportIdentifier_ReportId("REP-123");
        verify(employeeRepository).findEmployeeByUserId("tech-other-user");
        verify(reportRepository, never()).save(any());
    }

    // ==================== CREATE TESTS ====================

    @Test
    void createReport_validRequestByTechnician_createsSuccessfully() {
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(employeeRepository.findEmployeeByUserId("tech-user"))
                .thenReturn(technician);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.createReport(validRequest, "tech-user", "TECHNICIAN");

        assertNotNull(result);
        assertEquals("REP-123", result.getReportId());
        verify(appointmentRepository).findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1");
        verify(reportRepository).save(any(Report.class));
        verify(billRepository).save(any());
    }

    @Test
    void createReport_validRequestByAdmin_createsSuccessfully() {
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.createReport(validRequest, "admin", "ADMIN");

        assertNotNull(result);
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void createReport_appointmentNotFound_throwsResourceNotFound() {
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.createReport(validRequest, "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReport_appointmentNotCompleted_throwsInvalidOperation() {
        AppointmentStatus scheduledStatus = new AppointmentStatus();
        scheduledStatus.setAppointmentStatusType(AppointmentStatusType.SCHEDULED);
        appointment.setAppointmentStatus(scheduledStatus);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));

        assertThrows(InvalidOperationException.class,
                () -> reportService.createReport(validRequest, "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReport_reportAlreadyExists_throwsResourceAlreadyExists() {
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(report);

        assertThrows(ResourceAlreadyExistsException.class,
                () -> reportService.createReport(validRequest, "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReport_technicianNotAssignedToAppointment_throwsInvalidOperation() {
        Employee differentTech = new Employee();
        differentTech.setEmployeeIdentifier(new EmployeeIdentifier("EMP-999"));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(employeeRepository.findEmployeeByUserId("other-tech-user"))
                .thenReturn(differentTech);

        assertThrows(InvalidOperationException.class,
                () -> reportService.createReport(validRequest, "other-tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReport_withParts_createsSuccessfully() {
        Part part = new Part();
        part.setPartIdentifier(new PartIdentifier("PART-1"));
        part.setAvailable(true);

        ReportRequestModel.ReportPartRequestModel partRequest = ReportRequestModel.ReportPartRequestModel.builder()
                .partId("PART-1")
                .quantity(2)
                .price(BigDecimal.valueOf(25.0))
                .build();
        validRequest.setParts(List.of(partRequest));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(employeeRepository.findEmployeeByUserId("tech-user"))
                .thenReturn(technician);
        when(partRepository.findPartByPartIdentifier_PartId("PART-1"))
                .thenReturn(part);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.createReport(validRequest, "tech-user", "TECHNICIAN");

        assertNotNull(result);
        verify(partRepository).findPartByPartIdentifier_PartId("PART-1");
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void createReport_partNotFound_throwsResourceNotFound() {
        ReportRequestModel.ReportPartRequestModel partRequest = ReportRequestModel.ReportPartRequestModel.builder()
                .partId("PART-1")
                .quantity(2)
                .price(BigDecimal.valueOf(25.0))
                .build();
        validRequest.setParts(List.of(partRequest));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(employeeRepository.findEmployeeByUserId("tech-user"))
                .thenReturn(technician);
        when(partRepository.findPartByPartIdentifier_PartId("PART-1"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.createReport(validRequest, "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReport_partNotAvailable_throwsInvalidOperation() {
        Part part = new Part();
        part.setPartIdentifier(new PartIdentifier("PART-1"));
        part.setAvailable(false);
        part.setName("Test Part");

        ReportRequestModel.ReportPartRequestModel partRequest = ReportRequestModel.ReportPartRequestModel.builder()
                .partId("PART-1")
                .quantity(2)
                .price(BigDecimal.valueOf(25.0))
                .build();
        validRequest.setParts(List.of(partRequest));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(Optional.of(appointment));
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(null);
        when(employeeRepository.findEmployeeByUserId("tech-user"))
                .thenReturn(technician);
        when(partRepository.findPartByPartIdentifier_PartId("PART-1"))
                .thenReturn(part);

        assertThrows(InvalidOperationException.class,
                () -> reportService.createReport(validRequest, "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).save(any());
    }

    // ==================== READ TESTS ====================

    @Test
    void getReportById_adminRole_returnsReport() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(responseMapper.toResponseModel(report))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.getReportById("REP-123", "admin", "ADMIN");

        assertNotNull(result);
        assertEquals("REP-123", result.getReportId());
        verify(reportRepository).findReportByReportIdentifier_ReportId("REP-123");
    }

    @Test
    void getReportById_technicianOwner_returnsReport() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(responseMapper.toResponseModel(report))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.getReportById("REP-123", "tech-user", "TECHNICIAN");

        assertNotNull(result);
        verify(reportRepository).findReportByReportIdentifier_ReportId("REP-123");
    }

    @Test
    void getReportById_customerOwner_returnsReport() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(responseMapper.toResponseModel(report))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.getReportById("REP-123", "cust-user", "CUSTOMER");

        assertNotNull(result);
        verify(reportRepository).findReportByReportIdentifier_ReportId("REP-123");
    }

    @Test
    void getReportById_notFound_throwsResourceNotFound() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-999"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.getReportById("REP-999", "admin", "ADMIN"));
    }

    @Test
    void getReportById_technicianNotOwner_throwsInvalidOperation() {
        Employee otherTech = new Employee();
        otherTech.setEmployeeIdentifier(new EmployeeIdentifier("EMP-999"));

        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(employeeRepository.findEmployeeByUserId("other-tech"))
                .thenReturn(otherTech);

        assertThrows(InvalidOperationException.class,
                () -> reportService.getReportById("REP-123", "other-tech", "TECHNICIAN"));
    }

    @Test
    void getReportByAppointmentId_found_returnsReport() {
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1"))
                .thenReturn(report);
        when(responseMapper.toResponseModel(report))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.getReportByAppointmentId("APPT-1", "admin", "ADMIN");

        assertNotNull(result);
        verify(reportRepository).findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-1");
    }

    @Test
    void getReportByAppointmentId_notFound_throwsResourceNotFound() {
        when(reportRepository.findReportByAppointment_AppointmentIdentifier_AppointmentId("APPT-999"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.getReportByAppointmentId("APPT-999", "admin", "ADMIN"));
    }

    @Test
    void getTechnicianReports_adminRole_returnsList() {
        when(reportRepository.findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId("EMP-1"))
                .thenReturn(List.of(report));
        when(responseMapper.toResponseModelList(anyList()))
                .thenReturn(List.of(mockResponse));

        List<ReportResponseModel> result = reportService.getTechnicianReports("EMP-1", "admin", "ADMIN");

        assertEquals(1, result.size());
        verify(reportRepository).findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId("EMP-1");
    }

    @Test
    void getTechnicianReports_technicianOwnReports_returnsList() {
        when(reportRepository.findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId("EMP-1"))
                .thenReturn(List.of(report));
        when(responseMapper.toResponseModelList(anyList()))
                .thenReturn(List.of(mockResponse));

        List<ReportResponseModel> result = reportService.getTechnicianReports("EMP-1", "EMP-1", "TECHNICIAN");

        assertEquals(1, result.size());
        verify(reportRepository).findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId("EMP-1");
    }

    @Test
    void getTechnicianReports_technicianOtherReports_throwsInvalidOperation() {
        assertThrows(InvalidOperationException.class,
                () -> reportService.getTechnicianReports("EMP-1", "EMP-999", "TECHNICIAN"));
        verify(reportRepository, never()).findAllByAppointment_Technician_EmployeeIdentifier_EmployeeId(anyString());
    }

    @Test
    void getCustomerReports_adminRole_returnsList() {
        when(reportRepository.findAllByAppointment_Customer_CustomerIdentifier_CustomerId("CUST-1"))
                .thenReturn(List.of(report));
        when(responseMapper.toResponseModelList(anyList()))
                .thenReturn(List.of(mockResponse));

        List<ReportResponseModel> result = reportService.getCustomerReports("CUST-1", "admin", "ADMIN");

        assertEquals(1, result.size());
        verify(reportRepository).findAllByAppointment_Customer_CustomerIdentifier_CustomerId("CUST-1");
    }

    @Test
    void getCustomerReports_nonAdminRole_throwsInvalidOperation() {
        assertThrows(InvalidOperationException.class,
                () -> reportService.getCustomerReports("CUST-1", "cust-user", "CUSTOMER"));
        verify(reportRepository, never()).findAllByAppointment_Customer_CustomerIdentifier_CustomerId(anyString());
    }

    @Test
    void getAllReports_adminRole_returnsList() {
        when(reportRepository.findAll())
                .thenReturn(List.of(report));
        when(responseMapper.toResponseModelList(anyList()))
                .thenReturn(List.of(mockResponse));

        List<ReportResponseModel> result = reportService.getAllReports("admin", "ADMIN");

        assertEquals(1, result.size());
        verify(reportRepository).findAll();
    }

    // ==================== UPDATE TESTS ====================

    @Test
    void updateReport_adminRole_updatesSuccessfully() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.updateReport("REP-123", validRequest, "admin", "ADMIN");

        assertNotNull(result);
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void updateReport_technicianOwner_updatesSuccessfully() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(employeeRepository.findEmployeeByUserId("tech-user"))
                .thenReturn(technician);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.updateReport("REP-123", validRequest, "tech-user", "TECHNICIAN");

        assertNotNull(result);
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    void updateReport_reportNotFound_throwsResourceNotFound() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-999"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.updateReport("REP-999", validRequest, "admin", "ADMIN"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void updateReport_withParts_updatesSuccessfully() {
        Part part = new Part();
        part.setPartIdentifier(new PartIdentifier("PART-1"));

        ReportRequestModel.ReportPartRequestModel partRequest = ReportRequestModel.ReportPartRequestModel.builder()
                .partId("PART-1")
                .quantity(3)
                .price(BigDecimal.valueOf(30.0))
                .build();
        validRequest.setParts(List.of(partRequest));

        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(partRepository.findPartByPartIdentifier_PartId("PART-1"))
                .thenReturn(part);
        when(reportRepository.save(any(Report.class)))
                .thenReturn(report);
        when(responseMapper.toResponseModel(any(Report.class)))
                .thenReturn(mockResponse);

        ReportResponseModel result = reportService.updateReport("REP-123", validRequest, "admin", "ADMIN");

        assertNotNull(result);
        verify(partRepository).findPartByPartIdentifier_PartId("PART-1");
        verify(reportRepository).save(any(Report.class));
    }

    // ==================== DELETE TESTS ====================

    @Test
    void deleteReport_adminRole_deletesSuccessfully() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);

        reportService.deleteReport("REP-123", "admin", "ADMIN");

        verify(reportRepository).delete(report);
    }

    @Test
    void deleteReport_nonAdminRole_throwsInvalidOperation() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);

        assertThrows(InvalidOperationException.class,
                () -> reportService.deleteReport("REP-123", "tech-user", "TECHNICIAN"));
        verify(reportRepository, never()).delete(any());
    }

    @Test
    void deleteReport_reportNotFound_throwsResourceNotFound() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-999"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.deleteReport("REP-999", "admin", "ADMIN"));
        verify(reportRepository, never()).delete(any());
    }

    // ==================== PDF TESTS ====================
//    @Test
//    void getReportPdf_existingStoredFile_returnsBytes() throws Exception {
//        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
//                .thenReturn(report);
//
//        StoredFile stored = new StoredFile();
//        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name()))
//                .thenReturn(List.of(stored));
//        when(fileService.openStream(stored))
//                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
//
//        byte[] result = reportService.getReportPdf("REP-123", "admin", "ADMIN");
//
//        assertArrayEquals(new byte[]{1, 2, 3}, result);
//        verify(storedFileRepository).findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name());
//    }

//    @Test
//    void getReportPdf_noStoredFile_generatesNewPdf() throws Exception {
//        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
//                .thenReturn(report);
//        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name()))
//                .thenReturn(List.of());
//        when(responseMapper.toResponseModel(report))
//                .thenReturn(mockResponse);
//
//        StoredFile newFile = new StoredFile();
//        when(reportPdfGenerator.generateAndStoreReportPdf(any(ReportResponseModel.class), eq(fileService)))
//                .thenReturn(newFile);
//        when(fileService.openStream(newFile))
//                .thenReturn(new ByteArrayInputStream(new byte[]{4, 5, 6}));
//
//        byte[] result = reportService.getReportPdf("REP-123", "admin", "ADMIN");
//
//        assertArrayEquals(new byte[]{4, 5, 6}, result);
//        verify(reportPdfGenerator).generateAndStoreReportPdf(any(ReportResponseModel.class), eq(fileService));
//    }

    @Test
    void getReportPdf_reportNotFound_throwsResourceNotFound() {
        when(reportRepository.findReportByReportIdentifier_ReportId("REP-999"))
                .thenReturn(null);

        assertThrows(ResourceNotFoundException.class,
                () -> reportService.getReportPdf("REP-999", "admin", "ADMIN"));
    }

//    @Test
//    void getReportPdf_technicianOwner_returnsBytes() throws Exception {
//        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
//                .thenReturn(report);
//
//        StoredFile stored = new StoredFile();
//        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name()))
//                .thenReturn(List.of(stored));
//        when(fileService.openStream(stored))
//                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
//
//        byte[] result = reportService.getReportPdf("REP-123", "tech-user", "TECHNICIAN");
//
//        assertArrayEquals(new byte[]{1, 2, 3}, result);
//    }

    @Test
    void getReportPdf_technicianNotOwner_throwsInvalidOperation() {
        Employee otherTech = new Employee();
        otherTech.setEmployeeIdentifier(new EmployeeIdentifier("EMP-999"));

        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);
        when(employeeRepository.findEmployeeByUserId("other-tech"))
                .thenReturn(otherTech);

        assertThrows(InvalidOperationException.class,
                () -> reportService.getReportPdf("REP-123", "other-tech", "TECHNICIAN"));
    }

//    @Test
//    void getReportPdf_customerOwner_returnsBytes() throws Exception {
//        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
//                .thenReturn(report);
//
//        StoredFile stored = new StoredFile();
//        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
//                FileOwnerType.REPORT.name(), "REP-123", FileCategory.REPORT.name()))
//                .thenReturn(List.of(stored));
//        when(fileService.openStream(stored))
//                .thenReturn(new ByteArrayInputStream(new byte[]{1, 2, 3}));
//
//        byte[] result = reportService.getReportPdf("REP-123", "cust-user", "CUSTOMER");
//
//        assertArrayEquals(new byte[]{1, 2, 3}, result);
//    }

    @Test
    void getReportPdf_customerNotOwner_throwsInvalidOperation() {
        Customer otherCustomer = new Customer();
        otherCustomer.setUserId("other-customer");
        otherCustomer.setCustomerIdentifier(new CustomerIdentifier("CUST-999"));

        when(reportRepository.findReportByReportIdentifier_ReportId("REP-123"))
                .thenReturn(report);

        assertThrows(InvalidOperationException.class,
                () -> reportService.getReportPdf("REP-123", "other-customer", "CUSTOMER"));
    }
}