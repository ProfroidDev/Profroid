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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmployeeResponseModel> updateEmployee(
            @PathVariable String employeeId,
            @Valid @RequestBody EmployeeRequestModel employeeRequestModel,
            Authentication authentication) {
        
        // Check if user is ADMIN
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        
        // Get existing employee data
        EmployeeResponseModel existing = this.employeeService.getEmployeeById(employeeId);
        
        if (isAdmin) {
            // Admin can ONLY change the role, preserve all other fields
            employeeRequestModel.setUserId(existing.getUserId());
            employeeRequestModel.setFirstName(existing.getFirstName());
            employeeRequestModel.setLastName(existing.getLastName());
            employeeRequestModel.setEmployeeAddress(existing.getEmployeeAddress());
            employeeRequestModel.setPhoneNumbers(existing.getPhoneNumbers());
            // employeeRole from request is used (admin can change it)
        } else {
            // Non-admin users can only update their own employee record
            // Verify the employee record belongs to the user making the request
            if (!existing.getUserId().equals(employeeRequestModel.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Non-admin users cannot update employeeRole - preserve existing role
            employeeRequestModel.setEmployeeRole(existing.getEmployeeRole());
        }
        
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
