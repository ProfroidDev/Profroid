package com.profroid.profroidapp.reportsubdomain.presentationLayer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportResponseModel {

    private String reportId;

    // Appointment information
    private String appointmentId;
    private String appointmentDate;
    private String appointmentStatus; // SCHEDULED, COMPLETED, CANCELLED

    // Customer information (auto-populated from appointment)
    private String customerId;
    private String customerFirstName;
    private String customerLastName;
    private String customerPhone;

    // Technician information
    private String technicianId;
    private String technicianFirstName;
    private String technicianLastName;

    // Job information
    private String jobName;
    private BigDecimal hourlyRate;

    // Work details
    private BigDecimal hoursWorked;
    private BigDecimal frais;
    private BigDecimal fraisDeplacement;

    // Parts used
    private List<ReportPartResponseModel> parts;

    // Calculated amounts
    private BigDecimal laborCost; // hoursWorked * hourlyRate
    private BigDecimal partsCost; // Sum of all parts
    private BigDecimal subtotal; // laborCost + frais + fraisDeplacement + partsCost
    private BigDecimal tpsAmount; // 5%
    private BigDecimal tvqAmount; // 9.975%
    private BigDecimal total; // subtotal + taxes

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReportPartResponseModel {
        private String partId;
        private String partName;
        private Integer quantity;
        private BigDecimal price; // Manual price set by technician
        private BigDecimal totalPrice; // quantity * price
        private String notes;
    }
}
