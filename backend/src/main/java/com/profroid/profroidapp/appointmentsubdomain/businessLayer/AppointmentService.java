package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface AppointmentService {

    
    List<AppointmentResponseModel> getCustomerAppointments(String customerId);

    
    List<AppointmentResponseModel> getTechnicianAppointments(String technicianId);

    AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole);
}
