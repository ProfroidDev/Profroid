package com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers;


import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmployeeScheduleResponseMapper {

    default String map(EmployeeIdentifier value) {
        return value != null ? value.getEmployeeId() : null;
    }
}
