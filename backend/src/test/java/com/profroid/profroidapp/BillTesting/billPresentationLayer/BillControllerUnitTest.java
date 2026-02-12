package com.profroid.profroidapp.BillTesting.billPresentationLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.BillService;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillController;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
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
public class BillControllerUnitTest {

    @Mock
    private BillService billService;


    @InjectMocks
    private BillController billController;

    private BillResponseModel sampleBill;

    @BeforeEach
    void setup() {
        sampleBill = BillResponseModel.builder()
                .billId("BILL-2026-000001")
                .reportId("REP-123")
                .appointmentId("APT-1")
                .amount(BigDecimal.valueOf(114.98))
                .status("UNPAID")
                .build();

        // Provide TestingAuthenticationToken per test instead of mocking Authentication
    }

    @Test
    void getBillById_adminRole_returnsOk() {
        when(billService.getBillById(eq("BILL-2026-000001"), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleBill);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<BillResponseModel> response = billController.getBillById("BILL-2026-000001", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("BILL-2026-000001", response.getBody().getBillId());
        verify(billService).getBillById("BILL-2026-000001", "user-123", "ADMIN");
    }

    @Test
    void getBillByReportId_adminRole_returnsOk() {
        when(billService.getBillByReportId(eq(1), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleBill);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<BillResponseModel> response = billController.getBillByReportId(1, authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(billService).getBillByReportId(1, "user-123", "ADMIN");
    }

    @Test
    void getBillByAppointmentId_adminRole_returnsOk() {
        when(billService.getBillByAppointmentId(eq("APT-1"), eq("user-123"), eq("ADMIN")))
                .thenReturn(sampleBill);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<BillResponseModel> response = billController.getBillByAppointmentId("APT-1", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(billService).getBillByAppointmentId("APT-1", "user-123", "ADMIN");
    }

    @Test
    void getCustomerBills_adminRole_returnsOkList() {
        when(billService.getCustomerBills(eq("CUST-1"), eq("user-123"), eq("ADMIN")))
                .thenReturn(List.of(sampleBill));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<List<BillResponseModel>> response = billController.getCustomerBills("CUST-1", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(billService).getCustomerBills("CUST-1", "user-123", "ADMIN");
    }

    @Test
    void getAllBills_adminRole_returnsOkList() {
        when(billService.getAllBills(eq("user-123"), eq("ADMIN")))
                .thenReturn(List.of(sampleBill));

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<List<BillResponseModel>> response = billController.getAllBills(authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(billService).getAllBills("user-123", "ADMIN");
    }

    @Test
    void downloadBillPdf_adminRole_returnsPdf() {
        byte[] pdfBytes = new byte[]{4, 5, 6};
        when(billService.getBillPdf(eq("BILL-2026-000001"), eq("user-123"), eq("ADMIN"), eq("en")))
                .thenReturn(pdfBytes);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<byte[]> response = billController.downloadBillPdf("BILL-2026-000001", "en", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertArrayEquals(pdfBytes, response.getBody());
        verify(billService).getBillPdf("BILL-2026-000001", "user-123", "ADMIN", "en");
    }

    @Test
    void updateBillStatus_adminRole_returnsOk() {
        BillResponseModel updated = BillResponseModel.builder()
                .billId("BILL-2026-000001")
                .status("PAID")
                .build();
        when(billService.updateBillStatus(eq("BILL-2026-000001"), eq("PAID"), eq("user-123"), eq("ADMIN")))
                .thenReturn(updated);

        Authentication authentication = new org.springframework.security.authentication.TestingAuthenticationToken(
            "user-123", "password", "ROLE_ADMIN");
        ResponseEntity<BillResponseModel> response = billController.updateBillStatus("BILL-2026-000001", "PAID", authentication);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("PAID", response.getBody().getStatus());
        verify(billService).updateBillStatus("BILL-2026-000001", "PAID", "user-123", "ADMIN");
    }
}
