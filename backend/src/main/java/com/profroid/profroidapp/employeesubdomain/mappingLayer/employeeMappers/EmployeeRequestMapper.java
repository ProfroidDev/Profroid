package com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers;


import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface EmployeeRequestMapper {

    @Mappings({

            @Mapping(target = "id", ignore = true),

            @Mapping(source = "employeeRequestModel.firstName", target = "firstName"),
            @Mapping(source = "employeeRequestModel.lastName", target = "lastName"),
            @Mapping(source = "employeeRequestModel.userId", target = "userId"),


            @Mapping(source = "employeeRequestModel.phoneNumbers", target = "phoneNumbers"),
            @Mapping(source = "employeeRequestModel.employeeAddress", target = "employeeAddress"),
            @Mapping(source = "employeeRequestModel.employeeRole", target = "employeeRole"),

    })
    Employee toEntity(EmployeeRequestModel employeeRequestModel);


}