package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel;

import jakarta.validation.Valid;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface AppointmentService {

    AppointmentResponseModel addAppointment(AppointmentRequestModel requestModel, String userId, String userRole);
    
    List<AppointmentResponseModel> getCustomerAppointments(String customerId);

    
    List<AppointmentResponseModel> getTechnicianAppointments(String technicianId);

    AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole);

    AppointmentResponseModel patchAppointmentStatus(String appointmentId,
            AppointmentStatusChangeRequestModel statusRequest, String userId, String effectiveRole);

    AppointmentResponseModel updateAppointment(String appointmentId, AppointmentRequestModel appointmentRequest,
            String userId, String effectiveRole);
}
