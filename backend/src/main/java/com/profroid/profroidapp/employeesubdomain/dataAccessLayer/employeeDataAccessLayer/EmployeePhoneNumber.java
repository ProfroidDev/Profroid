package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;


import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
public class EmployeePhoneNumber {

    @NotNull
    @Enumerated(EnumType.STRING)
    private EmployeePhoneType type;

    @NotBlank(message = "Enter a valid phone number")
    private String number;
}
