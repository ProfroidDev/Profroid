package com.profroid.profroidapp.BillTesting.billPresentationLayer;

import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.reportsubdomain.businessLayer.BillService;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
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
public class BillControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private BillService billService;

    private BillResponseModel sampleBill() {
        return BillResponseModel.builder()
                .billId("BILL-2026-000001")
                .reportId("REP-123")
                .appointmentId("APT-1")
                .amount(BigDecimal.valueOf(114.98))
                .status("UNPAID")
                .build();
    }

    @Test
    void getBillById_returns200() {
        BillResponseModel bill = sampleBill();
        when(billService.getBillById(eq("BILL-2026-000001"), anyString(), anyString()))
                .thenReturn(bill);

        webTestClient.get()
                .uri("/api/v1/bills/{id}", "BILL-2026-000001")
                .exchange()
                .expectStatus().isOk()
                                .expectBody(BillResponseModel.class)
                                .consumeWith(res -> {
                                        Assertions.assertNotNull(res.getResponseBody());
                                        Assertions.assertEquals(bill.getBillId(), res.getResponseBody().getBillId());
                                });
    }

    @Test
    void getBillByReport_returns200() {
        BillResponseModel bill = sampleBill();
        when(billService.getBillByReportId(eq(1), anyString(), anyString()))
                .thenReturn(bill);

        webTestClient.get()
                .uri("/api/v1/bills/report/{repId}", 1)
                .exchange()
                .expectStatus().isOk()
                .expectBody(BillResponseModel.class)
                .consumeWith(res -> {
                    Assertions.assertNotNull(res.getResponseBody());
                    Assertions.assertEquals(bill.getBillId(), res.getResponseBody().getBillId());
                });
    }

    @Test
    void getBillByAppointment_returns200() {
        BillResponseModel bill = sampleBill();
        when(billService.getBillByAppointmentId(eq("APT-1"), anyString(), anyString()))
                .thenReturn(bill);

        webTestClient.get()
                .uri("/api/v1/bills/appointment/{aptId}", "APT-1")
                .exchange()
                .expectStatus().isOk()
                .expectBody(BillResponseModel.class)
                .consumeWith(res -> {
                    Assertions.assertNotNull(res.getResponseBody());
                    Assertions.assertEquals(bill.getBillId(), res.getResponseBody().getBillId());
                });
    }

    @Test
    void getCustomerBills_returnsList() {
        when(billService.getCustomerBills(eq("CUST-1"), anyString(), anyString()))
                .thenReturn(List.of(sampleBill()));

        webTestClient.get()
                .uri("/api/v1/bills/customer/{custId}", "CUST-1")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(BillResponseModel.class)
                .hasSize(1);
    }

    @Test
    void getAllBills_returnsList() {
        when(billService.getAllBills(anyString(), anyString()))
                .thenReturn(List.of(sampleBill()));

        webTestClient.get()
                .uri("/api/v1/bills")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(BillResponseModel.class)
                .hasSize(1);
    }

    @Test
    void downloadBillPdf_returnsPdf() {
        when(billService.getBillPdf(eq("BILL-2026-000001"), anyString(), anyString()))
                .thenReturn(new byte[]{9, 9, 9});

        webTestClient.get()
                .uri("/api/v1/bills/{id}/pdf", "BILL-2026-000001")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_PDF)
                .expectBody(byte[].class)
                .isEqualTo(new byte[]{9, 9, 9});
    }

    @Test
    void updateBillStatus_returns200() {
        BillResponseModel updated = BillResponseModel.builder()
                .billId("BILL-2026-000001")
                .status("PAID")
                .build();
        when(billService.updateBillStatus(eq("BILL-2026-000001"), eq("PAID"), anyString(), anyString()))
                .thenReturn(updated);

        webTestClient.put()
                .uri("/api/v1/bills/{id}/status?status=PAID", "BILL-2026-000001")
                .exchange()
                .expectStatus().isOk()
                .expectBody(BillResponseModel.class)
                .consumeWith(res -> {
                    Assertions.assertNotNull(res.getResponseBody());
                    Assertions.assertEquals("PAID", res.getResponseBody().getStatus());
                    Assertions.assertEquals("BILL-2026-000001", res.getResponseBody().getBillId());
                });
    }
}
