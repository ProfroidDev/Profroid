package com.profroid.profroidapp.reportsubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Integer> {
    
    /**
     * Find bill by bill ID (the generated unique ID like BILL-2026-000001)
     */
    Optional<Bill> findByBillId(String billId);
    
    /**
     * Find bill by report ID
     */
    Optional<Bill> findByReport_Id(Integer reportId);
    
    /**
     * Find all bills for a customer using customer identifier
     */
    @Query("SELECT b FROM Bill b WHERE b.customer.customerIdentifier.customerId = :customerId")
    List<Bill> findByCustomer_Id(@Param("customerId") String customerId);
    
    /**
     * Find all bills for a customer with a specific status
     */
    @Query("SELECT b FROM Bill b WHERE b.customer.customerIdentifier.customerId = :customerId AND b.status = :status")
    List<Bill> findByCustomer_IdAndStatus(@Param("customerId") String customerId, @Param("status") Bill.BillStatus status);
    
    /**
     * Find all unpaid bills
     */
    List<Bill> findByStatus(Bill.BillStatus status);
    
    /**
     * Find all bills for a specific appointment
     */
    Optional<Bill> findByAppointment_AppointmentIdentifier_AppointmentId(String appointmentId);

    Optional<Bill> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);
}
