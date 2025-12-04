package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employees")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @Embedded
    private EmployeeIdentifier employeeIdentifier;

    @NotNull
    private String firstName;

    @NotNull
    private String lastName;

    @ElementCollection
    @CollectionTable(name = "employee_phonenumbers",joinColumns = @JoinColumn(name = "employee_id"))
    private List<EmployeePhoneNumber> phoneNumbers = new ArrayList<>();

    @NotNull
    @Embedded
    private EmployeeAddress employeeAddress;

    @NotNull
    @Embedded
    private EmployeeRole employeeRole;

    @NotNull
    private String userId;

    @NotNull
    private Boolean isActive = true;


}
