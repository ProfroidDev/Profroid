package com.profroid.profroidapp.ReportTesting.reportPresentationLayer;

import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.reportsubdomain.businessLayer.ReportService;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportRequestModel;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = RANDOM_PORT)
public class ReportControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ReportService reportService;

    @Test
    void downloadReportPdf_returnsPdf() {
        when(reportService.getReportPdf(eq("REP-123"), anyString(), anyString()))
                .thenReturn(new byte[]{1, 2, 3});

        webTestClient.get()
                .uri("/api/v1/reports/{id}/pdf", "REP-123")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_PDF)
                .expectBody(byte[].class)
                .isEqualTo(new byte[]{1, 2, 3});
    }

    @Test
    void createReport_returns201() {
        ReportRequestModel request = ReportRequestModel.builder()
                .appointmentId("APT-1")
                .hoursWorked(BigDecimal.valueOf(2))
                .frais(BigDecimal.ZERO)
                .fraisDeplacement(BigDecimal.ZERO)
                .build();

        ReportResponseModel response = ReportResponseModel.builder()
                .reportId("REP-123")
                .appointmentId("APT-1")
                .hoursWorked(BigDecimal.valueOf(2))
                .subtotal(BigDecimal.valueOf(100))
                .tpsAmount(BigDecimal.valueOf(5))
                .tvqAmount(BigDecimal.valueOf(9.98))
                .total(BigDecimal.valueOf(114.98))
                .build();

        when(reportService.createReport(any(ReportRequestModel.class), anyString(), anyString()))
                .thenReturn(response);

        webTestClient.post()
                .uri("/api/v1/reports")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                                .expectBody(ReportResponseModel.class)
                                .consumeWith(res -> {
                                        Assertions.assertNotNull(res.getResponseBody());
                                        Assertions.assertEquals("REP-123", res.getResponseBody().getReportId());
                                        Assertions.assertEquals("APT-1", res.getResponseBody().getAppointmentId());
                                });
    }

    @Test
    void getById_returns200() {
        ReportResponseModel response = ReportResponseModel.builder().reportId("REP-123").build();
        when(reportService.getReportById(eq("REP-123"), anyString(), anyString())).thenReturn(response);

        webTestClient.get()
                .uri("/api/v1/reports/{id}", "REP-123")
                .exchange()
                .expectStatus().isOk()
                                .expectBody(ReportResponseModel.class)
                                .consumeWith(res -> {
                                        Assertions.assertNotNull(res.getResponseBody());
                                        Assertions.assertEquals("REP-123", res.getResponseBody().getReportId());
                                });
    }

    @Test
    void getByAppointment_returns200() {
        ReportResponseModel response = ReportResponseModel.builder().reportId("REP-123").appointmentId("APT-1").build();
        when(reportService.getReportByAppointmentId(eq("APT-1"), anyString(), anyString())).thenReturn(response);

        webTestClient.get()
                .uri("/api/v1/reports/appointment/{aptId}", "APT-1")
                .exchange()
                .expectStatus().isOk()
                                .expectBody(ReportResponseModel.class)
                                .consumeWith(res -> {
                                        Assertions.assertNotNull(res.getResponseBody());
                                        Assertions.assertEquals("REP-123", res.getResponseBody().getReportId());
                                        Assertions.assertEquals("APT-1", res.getResponseBody().getAppointmentId());
                                });
    }

    @Test
    void getTechnicianReports_returnsList() {
        when(reportService.getTechnicianReports(eq("TECH-1"), anyString(), anyString()))
                .thenReturn(List.of(ReportResponseModel.builder().reportId("REP-123").build()));

        webTestClient.get()
                .uri("/api/v1/reports/technician/{techId}", "TECH-1")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ReportResponseModel.class)
                .hasSize(1);
    }

    @Test
    void getCustomerReports_returnsList() {
        when(reportService.getCustomerReports(eq("CUST-1"), anyString(), anyString()))
                .thenReturn(List.of(ReportResponseModel.builder().reportId("REP-123").build()));

        webTestClient.get()
                .uri("/api/v1/reports/customer/{custId}", "CUST-1")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ReportResponseModel.class)
                .hasSize(1);
    }

    @Test
    void getAllReports_returnsList() {
        when(reportService.getAllReports(anyString(), anyString()))
                .thenReturn(List.of(ReportResponseModel.builder().reportId("REP-123").build()));

        webTestClient.get()
                .uri("/api/v1/reports")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(ReportResponseModel.class)
                .hasSize(1);
    }

    @Test
    void updateReport_returns200() {
        ReportResponseModel response = ReportResponseModel.builder().reportId("REP-123").build();
        when(reportService.updateReport(eq("REP-123"), any(ReportRequestModel.class), anyString(), anyString()))
                .thenReturn(response);

        ReportRequestModel request = ReportRequestModel.builder()
                .appointmentId("APT-1")
                .hoursWorked(BigDecimal.ONE)
                .frais(BigDecimal.ZERO)
                .fraisDeplacement(BigDecimal.ZERO)
                .build();

        webTestClient.put()
                .uri("/api/v1/reports/{id}", "REP-123")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                                .expectBody(ReportResponseModel.class)
                                .consumeWith(res -> {
                                        Assertions.assertNotNull(res.getResponseBody());
                                        Assertions.assertEquals("REP-123", res.getResponseBody().getReportId());
                                });
    }

    @Test
    void deleteReport_returns204() {
        doNothing().when(reportService).deleteReport(eq("REP-123"), anyString(), anyString());

        webTestClient.delete()
                .uri("/api/v1/reports/{id}", "REP-123")
                .exchange()
                .expectStatus().isNoContent();
    }
}
