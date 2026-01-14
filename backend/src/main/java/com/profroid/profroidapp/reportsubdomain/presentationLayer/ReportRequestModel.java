package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportRequestModel {

    @NotNull(message = "Appointment ID is required")
    private String appointmentId;

    @NotNull(message = "Hours worked is required")
    @PositiveOrZero(message = "Hours worked must be positive or zero")
    private BigDecimal hoursWorked;

    @NotNull(message = "Frais is required")
    @PositiveOrZero(message = "Frais must be positive or zero")
    private BigDecimal frais;

    @NotNull(message = "Frais de deplacement is required")
    @PositiveOrZero(message = "Frais de deplacement must be positive or zero")
    private BigDecimal fraisDeplacement;

    // List of parts with their quantities and manual prices
    private List<ReportPartRequestModel> parts;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReportPartRequestModel {
        @NotNull(message = "Part ID is required")
        private String partId;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;

        @NotNull(message = "Price is required")
        @PositiveOrZero(message = "Price must be positive or zero")
        private BigDecimal price;

        private String notes;
    }
}
