package com.profroid.profroidapp.appointmentsubdomain.mappingLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatus;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AppointmentRequestMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "appointmentIdentifier", expression = "java(new com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier())")
    @Mapping(target = "appointmentStatus", source = "appointmentRequestModel", qualifiedByName = "mapDefaultStatus")
    @Mapping(source = "appointmentRequestModel.appointmentDate", target = "appointmentDate")
    @Mapping(source = "appointmentRequestModel.description", target = "description")
    @Mapping(source = "appointmentRequestModel.appointmentAddress", target = "appointmentAddress")
    @Mapping(target = "customer", ignore = true) 
    @Mapping(target = "technician", ignore = true)  
    @Mapping(target = "job", ignore = true)  
    @Mapping(target = "cellar", ignore = true)  
    @Mapping(target = "schedule", ignore = true)  
    @Mapping(target = "isActive", constant = "true")
    Appointment toEntity(AppointmentRequestModel appointmentRequestModel);

    @Named("mapDefaultStatus")
    default AppointmentStatus mapDefaultStatus(AppointmentRequestModel model) {
        AppointmentStatus status = new AppointmentStatus();
        status.setAppointmentStatusType(AppointmentStatusType.SCHEDULED);
        return status;
    }
}
