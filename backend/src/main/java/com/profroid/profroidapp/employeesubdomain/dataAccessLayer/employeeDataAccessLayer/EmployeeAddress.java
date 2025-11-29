package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;


import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@NoArgsConstructor
@Data
@Builder
@AllArgsConstructor
public class EmployeeAddress {

    @NotNull
    private String streetAddress;
    @NotNull
    private String city;
    @NotNull
    private String province;
    @NotNull
    private String country;
    @NotNull
    private String postalCode;


}
