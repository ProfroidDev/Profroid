package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeBusinessLayer.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<EmployeeResponseModel> getEmployeeByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(this.employeeService.getEmployeeByUserId(userId));
    }

    @PostMapping()
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EmployeeResponseModel> addEmployee(
            @Valid @RequestBody EmployeeRequestModel employeeRequestModel) {
        EmployeeResponseModel created = this.employeeService.addEmployee(employeeRequestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EmployeeResponseModel> updateEmployee(
            @PathVariable String employeeId,
            @Valid @RequestBody EmployeeRequestModel employeeRequestModel) {
        EmployeeResponseModel updated = this.employeeService.updateEmployee(employeeId, employeeRequestModel);
        return ResponseEntity.status(HttpStatus.OK).body(updated);
    }

    @DeleteMapping("/{employeeId}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EmployeeResponseModel> deactivateEmployee(@PathVariable String employeeId) {
        EmployeeResponseModel deactivated = this.employeeService.deactivateEmployee(employeeId);
        return ResponseEntity.status(HttpStatus.OK).body(deactivated);
    }

    @PatchMapping("/{employeeId}/reactivate")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EmployeeResponseModel> reactivateEmployee(@PathVariable String employeeId) {
        EmployeeResponseModel reactivated = this.employeeService.reactivateEmployee(employeeId);
        return ResponseEntity.status(HttpStatus.OK).body(reactivated);
    }
}
