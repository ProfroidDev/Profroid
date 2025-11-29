package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeRequestMapper employeeRequestMapper;
    private final EmployeeResponseMapper employeeResponseMapper;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               EmployeeRequestMapper employeeRequestMapper,
                               EmployeeResponseMapper employeeResponseMapper) {
        this.employeeRepository = employeeRepository;
        this.employeeRequestMapper = employeeRequestMapper;
        this.employeeResponseMapper = employeeResponseMapper;
    }

    @Override
    public List<EmployeeResponseModel> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        return employeeResponseMapper.toResponseModelList(employees);
    }
}
