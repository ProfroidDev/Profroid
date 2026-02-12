package com.profroid.profroidapp.reportsubdomain.mappingLayer;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.BillResponseModel;
import org.springframework.stereotype.Component;

@Component
public class BillResponseMapper {
    
    public BillResponseModel toResponseModel(Bill bill) {
        if (bill == null) {
            return null;
        }
        
        return BillResponseModel.builder()
                .billId(bill.getBillId())
                .reportId(bill.getReport().getReportIdentifier().getReportId())
                .reportInternalId(bill.getReport().getId())
                .appointmentId(bill.getAppointment().getAppointmentIdentifier().getAppointmentId())
                .appointmentDate(bill.getAppointment().getAppointmentDate().toString())
                .customerId(bill.getCustomer().getCustomerIdentifier().getCustomerId())
                .customerFirstName(bill.getCustomer().getFirstName())
                .customerLastName(bill.getCustomer().getLastName())
                .jobName(bill.getAppointment().getJob().getJobName())
                .jobNameFr(bill.getAppointment().getJob().getJobNameFr())
                .amount(bill.getAmount())
                .status(bill.getStatus().toString())
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .paidAt(bill.getPaidAt())
                .build();
    }
}
