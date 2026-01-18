package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.BillRepository;
import com.profroid.profroidapp.reportsubdomain.mappingLayer.BillResponseMapper;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillServiceImpl implements BillService {
    
    private final BillRepository billRepository;
    private final BillResponseMapper billResponseMapper;
    
    public BillServiceImpl(BillRepository billRepository, BillResponseMapper billResponseMapper) {
        this.billRepository = billRepository;
        this.billResponseMapper = billResponseMapper;
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
            Bill.BillStatus newStatus = Bill.BillStatus.valueOf(status.toUpperCase());
            bill.setStatus(newStatus);
            
            // Set paid_at timestamp when marking as paid
            if (newStatus == Bill.BillStatus.PAID) {
                bill.setPaidAt(LocalDateTime.now());
            } else if (newStatus == Bill.BillStatus.UNPAID) {
                bill.setPaidAt(null);
            }
            
            Bill updatedBill = billRepository.save(bill);
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
}
