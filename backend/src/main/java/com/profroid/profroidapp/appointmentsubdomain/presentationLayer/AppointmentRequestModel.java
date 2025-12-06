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

    // BOOKING FLOW:
    // 1. Frontend fetches technician list (by name)
    // 2. When technician selected, fetch their Schedule records (available days/times from Schedule table)
    // 3. Customer picks appointmentDate from technician's available schedule slots
    // 4. Customer info comes from X-Customer-Id header when customer books themselves
    // 5. When technician creates appointment, they provide customerId in request body
    // 6. Service validates: appointmentDate matches Schedule entry AND technician has TECHNICIAN role

    // CUSTOMER IDENTIFICATION (when technician creates appointment for a customer)
    private String customerId;  // Optional - used when technician books for customer (UUID format)
    
    // TECHNICIAN IDENTIFICATION
    @NotBlank(message = "Technician first name is required.")
    private String technicianFirstName;

    @NotBlank(message = "Technician last name is required.")
    private String technicianLastName;

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
