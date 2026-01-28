package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.TechnicianBookedSlotsResponseModel;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public interface AppointmentService {

    AppointmentResponseModel addAppointment(AppointmentRequestModel requestModel, String userId, String userRole);
    
    List<AppointmentResponseModel> getCustomerAppointments(String customerId);
    
    List<AppointmentResponseModel> getTechnicianAppointments(String technicianId);
    
    List<AppointmentResponseModel> getAllAppointments();

    AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole);

    AppointmentResponseModel patchAppointmentStatus(String appointmentId,
            AppointmentStatusChangeRequestModel statusRequest, String userId, String effectiveRole);

    AppointmentResponseModel updateAppointment(String appointmentId, AppointmentRequestModel appointmentRequest,
            String userId, String effectiveRole);
    
    /**
     * Get booked time slots for a technician on a specific date.
     * Used by customers to check technician availability when booking.
     */
    TechnicianBookedSlotsResponseModel getTechnicianBookedSlots(String technicianId, LocalDate date, String appointmentId);
    
    /**
     * Get aggregated available time slots across all technicians for a given date.
     * Shows times when at least one technician is available.
     * Used by customers to see overall availability without selecting a technician first.
     */
        TechnicianBookedSlotsResponseModel getAggregatedAvailability(LocalDate date, String jobName, String userId, String userRole, String appointmentId);
}
