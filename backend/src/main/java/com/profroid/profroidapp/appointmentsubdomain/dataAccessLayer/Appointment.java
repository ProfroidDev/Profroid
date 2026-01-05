package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;


import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @Embedded
    private AppointmentIdentifier appointmentIdentifier;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // TECHNICIAN ROLE RESTRICTION:
    // - Service layer MUST validate that technician.getTechnicianRole() == TECHNICIAN
    // - Only employees with TECHNICIAN role can be assigned to appointments
    // - This prevents other roles (MANAGER, ADMIN) from performing service work
    @NotNull
    @ManyToOne
    @JoinColumn(name = "technician_id")
    private Employee technician;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "job_id")
    private Job job;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "cellar_id")
    private Cellar cellar;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @NotNull
    @Embedded
    private AppointmentAddress appointmentAddress;

    @NotNull
    private String description;

    @NotNull
    private LocalDateTime appointmentDate;

    @Embedded
    private AppointmentStatus appointmentStatus;

    // Track who created this appointment (CUSTOMER or TECHNICIAN)
    private String createdByRole;

    private Boolean isActive = true;

}
