package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerPhoneNumber;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponseModel {

    private String appointmentId;  // UUID

    // Customer Information
    private String customerId;  // Customer UUID
    private String customerFirstName;
    private String customerLastName;
    private List<CustomerPhoneNumber> customerPhoneNumbers;

    // Technician Information
    private String technicianId;  // Employee UUID
    private String technicianFirstName;
    private String technicianLastName;
    private EmployeeRole technicianRole;  // Must be TECHNICIAN to perform work

    // Job Information
    private String jobName;
    private String jobNameFr;
    private String jobType;
    private Double hourlyRate;

    // Cellar Information
    private String cellarName;

    // Appointment Details
    private LocalDateTime appointmentDate;      // start date-time (original)
    private LocalTime appointmentTime;          // start time only
    private LocalDateTime appointmentStartDate; // alias for start date-time
    private LocalTime appointmentStartTime;     // alias for start time only
    private LocalDateTime appointmentEndDate;
    private LocalTime appointmentEndTime;
    private String description;
    private String status;  // SCHEDULED, COMPLETED, CANCELLED

    // Appointment Address (where the work will be done)
    private AppointmentAddress appointmentAddress;

    // Track who created this appointment (CUSTOMER or TECHNICIAN)
    private String createdByRole;
}
