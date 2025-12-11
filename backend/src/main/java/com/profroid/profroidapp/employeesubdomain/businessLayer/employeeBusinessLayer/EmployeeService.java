package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer;


import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface EmployeeService {

    List<EmployeeResponseModel> getAllEmployees();

    EmployeeResponseModel getEmployeeById(String employeeId);

    EmployeeResponseModel getEmployeeByUserId(String userId);

    EmployeeResponseModel addEmployee(EmployeeRequestModel employeeRequestModel);

    EmployeeResponseModel updateEmployee(String employeeId, @Valid EmployeeRequestModel employeeRequestModel);

    EmployeeResponseModel deactivateEmployee(String employeeId);

    EmployeeResponseModel reactivateEmployee(String employeeId);
}
