package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/employees")
public class EmployeeController {

    public EmployeeService employeeService;

    @Autowired
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping()
    public ResponseEntity<List<EmployeeResponseModel>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<EmployeeResponseModel> getEmployeeById(@PathVariable String employeeId) {
        return ResponseEntity.ok(employeeService.getEmployeeById(employeeId));

    }
}
