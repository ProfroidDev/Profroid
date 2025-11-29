package com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer;


import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Street address cannot be blank")
    private String streetAddress;
    @NotBlank(message = "City cannot be blank")
    private String city;
    @NotBlank(message = "Province cannot be blank")
    private String province;
    @NotBlank(message = "Country cannot be blank")
    private String country;
    @NotBlank(message = "Postal code cannot be blank")
    private String postalCode;


}
