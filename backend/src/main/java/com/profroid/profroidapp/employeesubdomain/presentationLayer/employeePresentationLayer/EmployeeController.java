package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
        return ResponseEntity.ok(this.employeeService.getAllEmployees());
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<EmployeeResponseModel> getEmployeeById(@PathVariable String employeeId) {
        return ResponseEntity.ok(this.employeeService.getEmployeeById(employeeId));

    }

    @PostMapping()
    public ResponseEntity<EmployeeResponseModel> addEmployee(@Valid @RequestBody EmployeeRequestModel employeeRequestModel) {
        EmployeeResponseModel created = this.employeeService.addEmployee(employeeRequestModel);
        return ResponseEntity.status(HttpStatus.OK).body(created);
    }
}
