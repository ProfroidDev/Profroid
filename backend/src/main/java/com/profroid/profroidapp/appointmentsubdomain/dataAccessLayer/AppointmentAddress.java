package com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentAddress {

    @NotBlank(message = "Street address is required.")
    private String streetAddress;

    @NotBlank(message = "City is required.")
    private String city;

    @NotBlank(message = "Province is required.")
    private String province;

    @NotBlank(message = "Country is required.")
    private String country;

    @NotBlank(message = "Postal code is required.")
    private String postalCode;
}
