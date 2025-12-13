package com.profroid.profroidapp.appointmentsubdomain.presentationLayer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Lightweight response model containing only booked time slots for a technician.
 * Used by customers to check availability without exposing full appointment details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianBookedSlotsResponseModel {
    private String technicianId;
    private LocalDate date;
    private List<BookedSlot> bookedSlots;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookedSlot {
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
