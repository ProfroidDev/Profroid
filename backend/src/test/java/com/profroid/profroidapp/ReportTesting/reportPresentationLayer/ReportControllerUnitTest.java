package com.profroid.profroidapp.ReportTesting.reportPresentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.ReportService;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportController;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportControllerUnitTest {

    @Mock
    private ReportService reportService;


    @InjectMocks
    private ReportController reportController;

    private ReportResponseModel sampleResponse;
    private ReportRequestModel sampleRequest;

    @BeforeEach
    void setup() {
        sampleResponse = ReportResponseModel.builder()
                .reportId("REP-123")
                .appointmentId("APT-1")
                .hoursWorked(BigDecimal.valueOf(2))
                .frais(BigDecimal.ZERO)
                .fraisDeplacement(BigDecimal.ZERO)
                .subtotal(BigDecimal.valueOf(100))
                .tpsAmount(BigDecimal.valueOf(5))
                .tvqAmount(BigDecimal.valueOf(9.98))
                .total(BigDecimal.valueOf(114.98))
                .build();

        sampleRequest = ReportRequestModel.builder()
                .appointmentId("APT-1")
                .hoursWorked(BigDecimal.valueOf(2))
                .frais(BigDecimal.ZERO)
                .fraisDeplacement(BigDecimal.ZERO)
                .build();

        // No global auth mock; each test will provide a TestingAuthenticationToken
    }

    @Test
    void downloadReportPdf_adminRole_returnsPdf() {
        byte[] pdfBytes = new byte[]{1, 2, 3};
        when(reportService.getReportPdf(eq("REP-123"), eq("user-123"), eq("ADMIN"))).thenReturn(pdfBytes);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<byte[]> response = reportController.downloadReportPdf("REP-123", authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertArrayEquals(pdfBytes, response.getBody());
        verify(reportService).getReportPdf("REP-123", "user-123", "ADMIN");
    }

    @Test
    void createReport_adminRole_returnsCreated() {
        when(reportService.createReport(any(ReportRequestModel.class), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleResponse);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<ReportResponseModel> response = reportController.createReport(sampleRequest, authentication);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("REP-123", response.getBody().getReportId());
        verify(reportService).createReport(any(ReportRequestModel.class), eq("user-123"), eq("ADMIN"));
    }

    @Test
    void getReportById_adminRole_returnsOk() {
        when(reportService.getReportById(eq("REP-123"), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleResponse);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<ReportResponseModel> response = reportController.getReportById("REP-123", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("REP-123", response.getBody().getReportId());
        verify(reportService).getReportById("REP-123", "user-123", "ADMIN");
    }

    @Test
    void getReportByAppointmentId_adminRole_returnsOk() {
        when(reportService.getReportByAppointmentId(eq("APT-1"), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleResponse);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<ReportResponseModel> response = reportController.getReportByAppointmentId("APT-1", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reportService).getReportByAppointmentId("APT-1", "user-123", "ADMIN");
    }

    @Test
    void getTechnicianReports_adminRole_returnsOkList() {
        when(reportService.getTechnicianReports(eq("tech-1"), eq("user-123"), eq("ADMIN")))
                .thenReturn(List.of(sampleResponse));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<List<ReportResponseModel>> response = reportController.getTechnicianReports("tech-1", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verify(reportService).getTechnicianReports("tech-1", "user-123", "ADMIN");
    }

    @Test
    void getCustomerReports_adminRole_returnsOkList() {
        when(reportService.getCustomerReports(eq("cust-1"), eq("user-123"), eq("ADMIN")))
                .thenReturn(List.of(sampleResponse));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<List<ReportResponseModel>> response = reportController.getCustomerReports("cust-1", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reportService).getCustomerReports("cust-1", "user-123", "ADMIN");
    }

    @Test
    void getAllReports_adminRole_returnsOkList() {
        when(reportService.getAllReports(eq("user-123"), eq("ADMIN"))).thenReturn(List.of(sampleResponse));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<List<ReportResponseModel>> response = reportController.getAllReports(authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reportService).getAllReports("user-123", "ADMIN");
    }

    @Test
    void updateReport_adminRole_returnsOk() {
        when(reportService.updateReport(eq("REP-123"), any(ReportRequestModel.class), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleResponse);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<ReportResponseModel> response = reportController.updateReport("REP-123", sampleRequest, authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reportService).updateReport(eq("REP-123"), any(ReportRequestModel.class), eq("user-123"), eq("ADMIN"));
    }

    @Test
    void deleteReport_adminRole_returnsNoContent() {
        doNothing().when(reportService).deleteReport(eq("REP-123"), eq("user-123"), eq("ADMIN"));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<Void> response = reportController.deleteReport("REP-123", authentication);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(reportService).deleteReport("REP-123", "user-123", "ADMIN");
    }
}
