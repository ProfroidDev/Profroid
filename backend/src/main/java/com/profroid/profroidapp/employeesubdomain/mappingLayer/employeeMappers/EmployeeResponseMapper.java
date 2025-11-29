package com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmployeeResponseMapper {

    @Mappings({

            @Mapping(source = "employee.employeeIdentifier", target = "employeeIdentifier"),


            @Mapping(source = "employee.firstName", target = "firstName"),
            @Mapping(source = "employee.lastName", target = "lastName"),
            @Mapping(source = "employee.userId", target = "userId"),


            @Mapping(source = "employee.phoneNumbers", target = "phoneNumbers"),
            @Mapping(source = "employee.employeeAddress", target = "employeeAddress"),
            @Mapping(source = "employee.employeeRole", target = "employeeRole"),
    })
    EmployeeResponseModel toResponseModel(Employee employee);

    List<EmployeeResponseModel> toResponseModelList(List<Employee> employees);

}
