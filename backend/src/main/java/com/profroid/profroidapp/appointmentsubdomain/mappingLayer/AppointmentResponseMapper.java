package com.profroid.profroidapp.appointmentsubdomain.mappingLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AppointmentResponseMapper {

    @Mapping(source = "appointment.appointmentIdentifier.appointmentId", target = "appointmentId")
    @Mapping(source = "appointment.customer.customerIdentifier.customerId", target = "customerId")
    @Mapping(source = "appointment.customer.firstName", target = "customerFirstName")
    @Mapping(source = "appointment.customer.lastName", target = "customerLastName")
    @Mapping(source = "appointment.customer.phoneNumbers", target = "customerPhoneNumbers")
    @Mapping(source = "appointment.technician.employeeIdentifier.employeeId", target = "technicianId")
    @Mapping(source = "appointment.technician.firstName", target = "technicianFirstName")
    @Mapping(source = "appointment.technician.lastName", target = "technicianLastName")
    @Mapping(source = "appointment.technician.employeeRole", target = "technicianRole")
    @Mapping(source = "appointment.job.jobName", target = "jobName")
    @Mapping(source = "appointment.job.jobNameFr", target = "jobNameFr")
    @Mapping(source = "appointment.job.jobType", target = "jobType")
    @Mapping(source = "appointment.job.hourlyRate", target = "hourlyRate")
    @Mapping(source = "appointment.cellar.name", target = "cellarName")
    @Mapping(source = "appointment.appointmentDate", target = "appointmentDate")
    @Mapping(target = "appointmentTime", expression = "java(appointment.getAppointmentDate().toLocalTime())")
    @Mapping(source = "appointment.appointmentDate", target = "appointmentStartDate")
    @Mapping(target = "appointmentStartTime", expression = "java(appointment.getAppointmentDate().toLocalTime())")
    @Mapping(target = "appointmentEndDate", expression = "java(computeEndDateTime(appointment))")
    @Mapping(target = "appointmentEndTime", expression = "java(computeEndDateTime(appointment).toLocalTime())")
    @Mapping(source = "appointment.description", target = "description")
    @Mapping(source = "appointment.appointmentStatus.appointmentStatusType", target = "status")
    @Mapping(source = "appointment.appointmentAddress", target = "appointmentAddress")
    AppointmentResponseModel toResponseModel(Appointment appointment);

    List<AppointmentResponseModel> toResponseModelList(List<Appointment> appointments);

    default java.time.LocalDateTime computeEndDateTime(Appointment appointment) {
        int durationMinutes = appointment.getJob() != null && appointment.getJob().getEstimatedDurationMinutes() != null
                ? appointment.getJob().getEstimatedDurationMinutes()
                : resolveDefaultDuration(appointment);
        return appointment.getAppointmentDate().plusMinutes(durationMinutes);
    }

    private int resolveDefaultDuration(Appointment appointment) {
        if (appointment.getJob() == null || appointment.getJob().getJobType() == null) {
            return 60; // safe fallback
        }
        return switch (appointment.getJob().getJobType()) {
            case QUOTATION -> 30;
            case MAINTENANCE -> 60;
            case REPARATION -> 90;
            case INSTALLATION -> 240;
        };
    }
}
