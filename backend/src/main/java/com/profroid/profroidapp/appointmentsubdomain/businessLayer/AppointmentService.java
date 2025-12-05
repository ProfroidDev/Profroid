package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface AppointmentService {

    // Get all appointments for a customer (validated with X-Customer-Id header)
    List<AppointmentResponseModel> getCustomerAppointments(String customerId);

    // Get all appointments (jobs) for a technician (validated with X-Employee-Id header)
    List<AppointmentResponseModel> getTechnicianAppointments(String technicianId);

    // Get specific appointment by ID - validates that user is either the customer or technician
    AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole);
}
