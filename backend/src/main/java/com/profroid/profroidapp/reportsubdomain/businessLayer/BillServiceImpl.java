package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.BillResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.generators.BillPdfGenerator;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationPayloadBuilder;
import com.profroid.profroidapp.reportsubdomain.utils.PaymentNotificationUtil;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillServiceImpl implements BillService {
    
    private final BillRepository billRepository;
    private final BillResponseMapper billResponseMapper;
    private final BillPdfGenerator billPdfGenerator;
    private final FileService fileService;
    private final StoredFileRepository storedFileRepository;
    private final PaymentNotificationUtil paymentNotificationUtil;
    
    public BillServiceImpl(BillRepository billRepository,
                           BillResponseMapper billResponseMapper,
                           BillPdfGenerator billPdfGenerator,
                           FileService fileService,
                           StoredFileRepository storedFileRepository,
                           PaymentNotificationUtil paymentNotificationUtil) {
        this.billRepository = billRepository;
        this.billResponseMapper = billResponseMapper;
        this.billPdfGenerator = billPdfGenerator;
        this.fileService = fileService;
        this.storedFileRepository = storedFileRepository;
        this.paymentNotificationUtil = paymentNotificationUtil;
    }
    
    @Override
    public BillResponseModel getBillById(String billId, String userId, String userRole) {
        Bill bill = billRepository.findByBillId(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
        
        // Permission check: customer can only see their own bills, admin can see all
        if ("CUSTOMER".equals(userRole) && !userId.equals(bill.getCustomer().getUserId())) {
            throw new InvalidOperationException("You do not have permission to view this bill");
        }
        
        return billResponseMapper.toResponseModel(bill);
    }
    
    @Override
    public BillResponseModel getBillByReportId(Integer reportId, String userId, String userRole) {
        Bill bill = billRepository.findByReport_Id(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found for report ID: " + reportId));
        
        // Permission check: customer can only see their own bills, admin can see all
        if ("CUSTOMER".equals(userRole) && !userId.equals(bill.getCustomer().getUserId())) {
            throw new InvalidOperationException("You do not have permission to view this bill");
        }
        
        return billResponseMapper.toResponseModel(bill);
    }
    
    @Override
    public List<BillResponseModel> getCustomerBills(String customerId, String userId, String userRole) {
        // Get bills for the customerId
        List<Bill> bills = billRepository.findByCustomer_Id(customerId);
        
        // Permission check: customer can only see their own bills, admin can see all
        if ("CUSTOMER".equals(userRole)) {
            // Verify that the customerId belongs to the authenticated user
            if (!bills.isEmpty() && !userId.equals(bills.get(0).getCustomer().getUserId())) {
                throw new InvalidOperationException("You do not have permission to view these bills");
            }
        }
        
        return bills.stream()
                .map(billResponseMapper::toResponseModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<BillResponseModel> getAllBills(String userId, String userRole) {
        // Permission check: only admin can see all bills
        if (!"ADMIN".equals(userRole)) {
            throw new InvalidOperationException("You do not have permission to view all bills");
        }
        
        return billRepository.findAll().stream()
                .map(billResponseMapper::toResponseModel)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public BillResponseModel updateBillStatus(String billId, String status, String userId, String userRole) {
        // Permission check: only admin can update bill status
        if (!"ADMIN".equals(userRole)) {
            throw new InvalidOperationException("You do not have permission to update bill status");
        }
        
        Bill bill = billRepository.findByBillId(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
        
        try {
            Bill.BillStatus previousStatus = bill.getStatus();
            Bill.BillStatus newStatus = Bill.BillStatus.valueOf(status.toUpperCase());
            bill.setStatus(newStatus);
            
            // Set paid_at timestamp when marking as paid
            if (newStatus == Bill.BillStatus.PAID) {
                bill.setPaidAt(LocalDateTime.now());
            } else if (newStatus == Bill.BillStatus.UNPAID) {
                bill.setPaidAt(null);
            }
            
            Bill updatedBill = billRepository.save(bill);

            if (newStatus == Bill.BillStatus.PAID && previousStatus != Bill.BillStatus.PAID) {
                paymentNotificationUtil.sendPaymentPaidNotification(
                        PaymentNotificationPayloadBuilder.buildCustomerRecipient(updatedBill),
                        PaymentNotificationPayloadBuilder.buildPaymentDetails(updatedBill)
                );
            }

            return billResponseMapper.toResponseModel(updatedBill);
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid bill status: " + status);
        }
    }
    
    @Override
    public BillResponseModel getBillByAppointmentId(String appointmentId, String userId, String userRole) {
        Bill bill = billRepository.findByAppointment_AppointmentIdentifier_AppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found for appointment ID: " + appointmentId));
        
        // Permission check: customer can only see their own bills, admin can see all
        if ("CUSTOMER".equals(userRole) && !userId.equals(bill.getCustomer().getUserId())) {
            throw new InvalidOperationException("You do not have permission to view this bill");
        }
        
        return billResponseMapper.toResponseModel(bill);
    }
    
    @Override
    public byte[] getBillPdf(String billId, String userId, String userRole, String language) {
        Bill bill = billRepository.findByBillId(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
        
        // Permission check: customer can only download their own bills, admin can download any
        if ("CUSTOMER".equals(userRole) && !userId.equals(bill.getCustomer().getUserId())) {
            throw new InvalidOperationException("You do not have permission to download this bill");
        }

        try {
            // Always regenerate PDF to ensure language is respected
            // Delete old cached file if it exists
            List<StoredFile> files = storedFileRepository.findAllByOwnerTypeAndOwnerIdAndCategoryAndDeletedAtIsNull(
                    FileOwnerType.BILL.name(), billId, FileCategory.BILL.name());
            if (!files.isEmpty()) {
                StoredFile oldFile = files.get(0);
                fileService.delete(oldFile.getId());
                storedFileRepository.delete(oldFile);
            }

            // Generate on-demand with requested language and store, then return
            StoredFile created = billPdfGenerator.generateAndStoreBillPdf(bill, fileService, language);
            try (InputStream is = fileService.openStream(created)) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch bill PDF", e);
        }
    }

    // Convenience overload for backward compatibility
    public byte[] getBillPdf(String billId, String userId, String userRole) {
        return getBillPdf(billId, userId, userRole, "en");
    }
}
