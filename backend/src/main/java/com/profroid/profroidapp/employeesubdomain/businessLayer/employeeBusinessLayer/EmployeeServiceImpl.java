package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.security.core.parameters.P;
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

    @Override
    public EmployeeResponseModel getEmployeeById(String employeeId) {

        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);

        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }
        return employeeResponseMapper.toResponseModel(employee);
    }

    @Override
    public EmployeeResponseModel addEmployee(EmployeeRequestModel employeeRequestModel) {

        String userId = employeeRequestModel.getUserId();

        if (employeeRepository.findEmployeeByUserId(userId) != null) {
            throw new ResourceAlreadyExistsException(
                    "Cannot add employee: An employee already exists with user ID '" + userId + "'."
            );
        }

        Employee employee = employeeRequestMapper.toEntity(employeeRequestModel);

        employee.setEmployeeIdentifier(new EmployeeIdentifier());

        Employee savedEmployee = employeeRepository.save(employee);
        return employeeResponseMapper.toResponseModel(savedEmployee);
    }
}
