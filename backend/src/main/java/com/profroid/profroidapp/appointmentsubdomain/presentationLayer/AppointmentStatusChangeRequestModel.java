package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentStatusChangeRequestModel {
    @NotBlank(message = "Status is required.")
    private String status;
}
