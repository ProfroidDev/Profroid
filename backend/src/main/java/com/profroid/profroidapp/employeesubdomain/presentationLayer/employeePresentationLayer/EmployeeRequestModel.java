package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer;


import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeAddress;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeePhoneNumber;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeRequestModel {

    @NotBlank(message = "First name is required.")
    private String firstName;

    @NotBlank(message = "Last name is required.")
    private String lastName;

    @NotEmpty(message = "At least one phone number is required.")
    @Valid
    private List<EmployeePhoneNumber> phoneNumbers;

    @NotNull(message = "Employee address is required.")
    @Valid
    private EmployeeAddress employeeAddress;

    @Valid
    private EmployeeRole employeeRole;

    // userId is set by controller from JWT token, never sent from client
    private String userId;
}
