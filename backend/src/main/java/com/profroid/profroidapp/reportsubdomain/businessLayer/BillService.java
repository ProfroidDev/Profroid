package com.profroid.profroidapp.reportsubdomain.businessLayer;

import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;

import java.util.List;

public interface BillService {
    
    /**
     * Get bill by bill ID
     */
    BillResponseModel getBillById(String billId, String userId, String userRole);
    
    /**
     * Get bill by report ID
     */
    BillResponseModel getBillByReportId(Integer reportId, String userId, String userRole);
    
    /**
     * Get all bills for a customer (customer only sees their own, admin sees all)
     */
    List<BillResponseModel> getCustomerBills(String customerId, String userId, String userRole);
    
    /**
     * Get all bills (admin only)
     */
    List<BillResponseModel> getAllBills(String userId, String userRole);
    
    /**
     * Update bill status (mark as paid or unpaid)
     */
    BillResponseModel updateBillStatus(String billId, String status, String userId, String userRole);
    
    /**
     * Get bill by appointment ID
     */
    BillResponseModel getBillByAppointmentId(String appointmentId, String userId, String userRole);
}
