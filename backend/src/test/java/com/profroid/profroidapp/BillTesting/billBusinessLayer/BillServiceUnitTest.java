package com.profroid.profroidapp.BillTesting.billBusinessLayer;

import com.profroid.profroidapp.reportsubdomain.businessLayer.BillServiceImpl;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.BillResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.generators.BillPdfGenerator;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BillServiceUnitTest {

    @Mock
    private BillRepository billRepository;
    @Mock
    private BillResponseMapper billResponseMapper;
    @Mock
    private BillPdfGenerator billPdfGenerator;
    @Mock
    private FileService fileService;
    @Mock
    private StoredFileRepository storedFileRepository;

    @InjectMocks
    private BillServiceImpl billService;

    private Bill bill;
    private BillResponseModel responseModel;

    @BeforeEach
    void setup() {
        bill = new Bill();
        bill.setId(1);
        bill.setBillId("BILL-2026-000001");
        bill.setAmount(BigDecimal.valueOf(114.98));
        bill.setStatus(Bill.BillStatus.UNPAID);
        bill.setCreatedAt(LocalDateTime.now());

        Customer customer = new Customer();
        customer.setUserId("user-123");
        bill.setCustomer(customer);

        responseModel = BillResponseModel.builder()
                .billId(bill.getBillId())
                .amount(bill.getAmount())
                .status(bill.getStatus().name())
                .build();
    }

    @Test
    void getBillById_admin_returnsResponse() {
        when(billRepository.findByBillId(eq("BILL-2026-000001")))
                .thenReturn(Optional.of(bill));
        when(billResponseMapper.toResponseModel(eq(bill)))
                .thenReturn(responseModel);

        BillResponseModel result = billService.getBillById("BILL-2026-000001", "user-456", "ADMIN");
        assertEquals("BILL-2026-000001", result.getBillId());
        verify(billRepository).findByBillId("BILL-2026-000001");
    }

    @Test
    void getBillById_customerNotOwner_throwsInvalidOperation() {
        when(billRepository.findByBillId(eq("BILL-2026-000001")))
                .thenReturn(Optional.of(bill));

        assertThrows(InvalidOperationException.class,
                () -> billService.getBillById("BILL-2026-000001", "other-user", "CUSTOMER"));
    }

    @Test
    void getBillById_notFound_throwsResourceNotFound() {
        when(billRepository.findByBillId(anyString())).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> billService.getBillById("NOPE", "user-123", "ADMIN"));
    }

    @Test
    void getAllBills_nonAdmin_throwsInvalidOperation() {
        assertThrows(InvalidOperationException.class,
                () -> billService.getAllBills("user-123", "CUSTOMER"));
        verify(billRepository, never()).findAll();
    }

    @Test
    void updateBillStatus_admin_setsPaidTimestamp() {
        when(billRepository.findByBillId(eq("BILL-2026-000001")))
                .thenReturn(Optional.of(bill));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(billResponseMapper.toResponseModel(any(Bill.class)))
                .thenAnswer(invocation -> {
                    Bill b = invocation.getArgument(0);
                    return BillResponseModel.builder()
                            .billId(b.getBillId())
                            .status(b.getStatus().name())
                            .paidAt(b.getPaidAt())
                            .build();
                });

        BillResponseModel updated = billService.updateBillStatus("BILL-2026-000001", "PAID", "admin", "ADMIN");
        assertEquals("PAID", updated.getStatus());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void getBillPdf_existingStoredFile_returnsBytes() throws Exception {
        StoredFile stored = new StoredFile();
        stored.setOwnerType(FileOwnerType.BILL.name());
        stored.setOwnerId("BILL-2026-000001");
        stored.setCategory(FileCategory.BILL.name());

        when(billRepository.findByBillId(eq("BILL-2026-000001")))
                .thenReturn(Optional.of(bill));
        when(storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
                eq(FileOwnerType.BILL.name()), eq("BILL-2026-000001"), eq(FileCategory.BILL.name())))
                .thenReturn(List.of(stored));
        when(fileService.openStream(eq(stored))).thenReturn(new ByteArrayInputStream(new byte[]{7, 8, 9}));

        byte[] result = billService.getBillPdf("BILL-2026-000001", "user-123", "ADMIN");
        assertArrayEquals(new byte[]{7, 8, 9}, result);
    }

    // ==================== getBillByReportId TESTS ====================

    @Test
    void getBillByReportId_admin_returnsResponse() {
        when(billRepository.findByReport_Id(eq(1)))
                .thenReturn(Optional.of(bill));
        when(billResponseMapper.toResponseModel(eq(bill)))
                .thenReturn(responseModel);

        BillResponseModel result = billService.getBillByReportId(1, "admin", "ADMIN");
        assertEquals("BILL-2026-000001", result.getBillId());
        verify(billRepository).findByReport_Id(1);
    }

    @Test
    void getBillByReportId_customerOwner_returnsResponse() {
        when(billRepository.findByReport_Id(eq(1)))
                .thenReturn(Optional.of(bill));
        when(billResponseMapper.toResponseModel(eq(bill)))
                .thenReturn(responseModel);

        BillResponseModel result = billService.getBillByReportId(1, "user-123", "CUSTOMER");
        assertEquals("BILL-2026-000001", result.getBillId());
    }

    @Test
    void getBillByReportId_customerNotOwner_throwsInvalidOperation() {
        when(billRepository.findByReport_Id(eq(1)))
                .thenReturn(Optional.of(bill));

        assertThrows(InvalidOperationException.class,
                () -> billService.getBillByReportId(1, "other-user", "CUSTOMER"));
    }

    @Test
    void getBillByReportId_notFound_throwsResourceNotFound() {
        when(billRepository.findByReport_Id(anyInt())).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> billService.getBillByReportId(999, "admin", "ADMIN"));
    }

    // ==================== getCustomerBills TESTS ====================

    @Test
    void getCustomerBills_admin_returnsList() {
        List<Bill> bills = List.of(bill);
        when(billRepository.findByCustomer_Id(eq("1"))).thenReturn(bills);
        when(billResponseMapper.toResponseModel(any(Bill.class)))
                .thenReturn(responseModel);

        List<BillResponseModel> result = billService.getCustomerBills("1", "admin", "ADMIN");
        assertEquals(1, result.size());
        verify(billRepository).findByCustomer_Id("1");
    }

    @Test
    void getCustomerBills_customerOwner_returnsList() {
        List<Bill> bills = List.of(bill);
        when(billRepository.findByCustomer_Id(eq("1"))).thenReturn(bills);
        when(billResponseMapper.toResponseModel(any(Bill.class)))
                .thenReturn(responseModel);

        List<BillResponseModel> result = billService.getCustomerBills("1", "user-123", "CUSTOMER");
        assertEquals(1, result.size());
    }

    @Test
    void getCustomerBills_customerNotOwner_throwsInvalidOperation() {
        List<Bill> bills = List.of(bill);
        when(billRepository.findByCustomer_Id(eq("1"))).thenReturn(bills);

        assertThrows(InvalidOperationException.class,
                () -> billService.getCustomerBills("1", "other-user", "CUSTOMER"));
    }

    @Test
    void getCustomerBills_noBillsForCustomer_returnsEmpty() {
        when(billRepository.findByCustomer_Id(eq("1"))).thenReturn(List.of());

        List<BillResponseModel> result = billService.getCustomerBills("1", "admin", "ADMIN");
        assertTrue(result.isEmpty());
    }

    // ==================== getBillByAppointmentId TESTS ====================

    @Test
    void getBillByAppointmentId_admin_returnsResponse() {
        when(billRepository.findByAppointment_AppointmentIdentifier_AppointmentId(eq("APPT-1")))
                .thenReturn(Optional.of(bill));
        when(billResponseMapper.toResponseModel(eq(bill)))
                .thenReturn(responseModel);

        BillResponseModel result = billService.getBillByAppointmentId("APPT-1", "admin", "ADMIN");
        assertEquals("BILL-2026-000001", result.getBillId());
        verify(billRepository).findByAppointment_AppointmentIdentifier_AppointmentId("APPT-1");
    }

    @Test
    void getBillByAppointmentId_customerOwner_returnsResponse() {
        when(billRepository.findByAppointment_AppointmentIdentifier_AppointmentId(eq("APPT-1")))
                .thenReturn(Optional.of(bill));
        when(billResponseMapper.toResponseModel(eq(bill)))
                .thenReturn(responseModel);

        BillResponseModel result = billService.getBillByAppointmentId("APPT-1", "user-123", "CUSTOMER");
        assertEquals("BILL-2026-000001", result.getBillId());
    }

    @Test
    void getBillByAppointmentId_customerNotOwner_throwsInvalidOperation() {
        when(billRepository.findByAppointment_AppointmentIdentifier_AppointmentId(eq("APPT-1")))
                .thenReturn(Optional.of(bill));

        assertThrows(InvalidOperationException.class,
                () -> billService.getBillByAppointmentId("APPT-1", "other-user", "CUSTOMER"));
    }

    @Test
    void getBillByAppointmentId_notFound_throwsResourceNotFound() {
        when(billRepository.findByAppointment_AppointmentIdentifier_AppointmentId(anyString()))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> billService.getBillByAppointmentId("APPT-999", "admin", "ADMIN"));
    }
}
