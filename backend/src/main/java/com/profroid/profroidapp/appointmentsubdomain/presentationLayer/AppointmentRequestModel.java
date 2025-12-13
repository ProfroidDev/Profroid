package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentAddress;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentRequestModel {

    // UPDATED BOOKING FLOW (for customer mode):
    // 1. Customer selects: Service (job type), Date, Time
    // 2. Frontend shows aggregated availability across all technicians
    // 3. When customer confirms, technician is auto-assigned (least-booked this week, or random if equal)
    // 4. For technician mode: technician can specify exact technician assignment

    // CUSTOMER IDENTIFICATION (when technician creates appointment for a customer)
    private String customerId;  // Optional - used when technician books for customer (UUID format)
    
    // TECHNICIAN IDENTIFICATION (Optional for customers - auto-assigned)
    private String technicianFirstName;  // Optional for customer bookings, required for technician bookings

    private String technicianLastName;   // Optional for customer bookings, required for technician bookings

    @NotBlank(message = "Job name is required.")
    private String jobName;

    @NotBlank(message = "Cellar name is required.")
    private String cellarName;

    @NotNull(message = "Appointment date and time is required.")
    @Future(message = "Appointment date must be in the future.")
    private LocalDateTime appointmentDate;  // Must match one of technician's Schedule entries

    @NotBlank(message = "Description is required.")
    private String description;

    @NotNull(message = "Appointment address is required.")
    @Valid
    private AppointmentAddress appointmentAddress;
}
