package com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeAddress;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeePhoneNumber;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeResponseModel {

    private EmployeeIdentifier employeeIdentifier;

    private String firstName;
    private String lastName;
    private String userId;

    private List<EmployeePhoneNumber> phoneNumbers;
    private EmployeeAddress employeeAddress;

    private EmployeeRole employeeRole;
}
