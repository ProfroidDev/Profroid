package com.profroid.profroidapp.appointmentsubdomain.utils;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.*;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Component
public class AppointmentValidationUtils {

    private final AppointmentRepository appointmentRepository;
    private final ScheduleRepository scheduleRepository;

    public AppointmentValidationUtils(AppointmentRepository appointmentRepository,
                                      ScheduleRepository scheduleRepository) {
        this.appointmentRepository = appointmentRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public void validateBookingDeadline(LocalDateTime appointmentDateTime, LocalDateTime now) {
        int appointmentHour = appointmentDateTime.getHour();
        LocalDate appointmentDate = appointmentDateTime.toLocalDate();
        
        // AM appointment (9h or 11h)
        if (appointmentHour == 9 || appointmentHour == 11) {
            // Must book by 5 PM (17:00) the previous day
            LocalDateTime deadline = appointmentDate.minusDays(1).atTime(17, 0);
            if (now.isAfter(deadline)) {
                throw new InvalidOperationException(
                    "AM appointments (9 AM, 11 AM) must be booked by 5:00 PM the previous day. " +
                    "Deadline was: " + deadline
                );
            }
        } 
        // PM appointment (13h, 15h, 17h)
        else if (appointmentHour == 13 || appointmentHour == 15 || appointmentHour == 17) {
            // Must book by 9 AM the same day
            LocalDateTime deadline = appointmentDate.atTime(9, 0);
            if (now.isAfter(deadline)) {
                throw new InvalidOperationException(
                    "PM appointments (1 PM, 3 PM, 5 PM) must be booked by 9:00 AM on the same day. " +
                    "Deadline was: " + deadline
                );
            }
        }
    }

    public void validateServiceTypeRestrictions(JobType jobType, String userRole) {
        if ("CUSTOMER".equals(userRole)) {
            if (jobType != JobType.QUOTATION) {
                throw new InvalidOperationException(
                    "Customers can only book quotation appointments. " +
                    "Requested service type: " + jobType
                );
            }
        }
        // Technicians can book any service type - no restriction needed
    }


    public void validateDuplicateAddressAndDay(
            AppointmentRequestModel requestModel, 
            LocalDate appointmentDate,
            Customer customer,
            Employee technician) {
        
        AppointmentAddress address = requestModel.getAppointmentAddress();
        
        // Find appointments at same address on same day (SCHEDULED or COMPLETED status)
        // Only scheduled appointments block new bookings; completed/cancelled should not block
        List<AppointmentStatusType> blockingStatuses = Arrays.asList(
            AppointmentStatusType.SCHEDULED
        );
        
        List<Appointment> existingAppointments = appointmentRepository.findByAddressAndDateAndStatusIn(
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode(),
            appointmentDate,
            blockingStatuses
        );
        
        if (!existingAppointments.isEmpty()) {
            Appointment blocking = existingAppointments.get(0);
            
            throw new InvalidOperationException(
                "An appointment already exists for this address on " + appointmentDate + ". " +
                "Status: " + blocking.getAppointmentStatus().getAppointmentStatusType() + ". " +
                "Please contact the technician if this is an error, or the customer should cancel " +
                "the existing appointment before booking a new one."
            );
        }
    }

    public void validateDuplicateQuotation(
            JobType jobType,
            AppointmentRequestModel requestModel,
            LocalDate appointmentDate,
            LocalDateTime appointmentDateTime,
            Customer customer) {
        validateDuplicateQuotation(jobType, requestModel, appointmentDate, appointmentDateTime, customer, null);
    }

    public void validateDuplicateQuotation(
            JobType jobType,
            AppointmentRequestModel requestModel,
            LocalDate appointmentDate,
            LocalDateTime appointmentDateTime,
            Customer customer,
            String excludeAppointmentId) {
        
        // Only validate if the current job is a quotation
        if (jobType != JobType.QUOTATION) {
            return;
        }
        
        AppointmentAddress address = requestModel.getAppointmentAddress();
        
        // Find existing quotations at same address on same day (regardless of customer)
        // Only SCHEDULED or COMPLETED quotations block new quotations
        List<Appointment> quotationsOnSameDay = appointmentRepository.findQuotationsByAddressAndDate(
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode(),
            appointmentDate
        );
        
        // Filter by status - SCHEDULED and COMPLETED block new quotations, but CANCELLED do not
        // Only one quotation per address per day (excluding cancelled ones)
        List<AppointmentStatusType> blockingStatuses = Arrays.asList(
            AppointmentStatusType.SCHEDULED,
            AppointmentStatusType.COMPLETED
        );
        
        List<Appointment> blockingQuotations = quotationsOnSameDay.stream()
            .filter(apt -> blockingStatuses.contains(apt.getAppointmentStatus().getAppointmentStatusType()))
            .filter(apt -> excludeAppointmentId == null || 
                          !apt.getAppointmentIdentifier().getAppointmentId().equals(excludeAppointmentId))
            .toList();
        
        if (!blockingQuotations.isEmpty()) {
            // Block ANY new quotation at this address on this day - only one quotation per address per day
            Appointment blocking = blockingQuotations.get(0);
            
            throw new InvalidOperationException(
                "ERROR_QUOTATION_EXISTS"
            );
        }
    }

    public void validateQuotationCompleted(
            JobType jobType,
            AppointmentRequestModel requestModel,
            Customer customer,
            LocalDateTime appointmentDateTime) {
        
        // Validation removed: Services can be scheduled before, after, or alongside quotations
        // Quotations and services are now independent of each other
    }

    public void validateTimeSlotAvailability(Employee technician, LocalDateTime appointmentDateTime, Job job) {
        validateTimeSlotAvailability(technician, appointmentDateTime, job, null);
    }

    public void validateTimeSlotAvailability(Employee technician, LocalDateTime appointmentDateTime, Job job, String excludeAppointmentId) {
        LocalDate appointmentDate = appointmentDateTime.toLocalDate();
        LocalTime appointmentTime = appointmentDateTime.toLocalTime();
        int appointmentHour = appointmentTime.getHour();
        
        // Validate that appointment is at a valid time slot (technician availability: 9, 11, 13, 15)
        if (appointmentHour != 9 && appointmentHour != 11 && appointmentHour != 13 && appointmentHour != 15) {
            throw new InvalidOperationException(
                "Appointments can only be scheduled at 9:00 AM, 11:00 AM, 1:00 PM, or 3:00 PM. " +
                "Requested time: " + appointmentHour + ":00"
            );
        }
        // Block 5 PM slot explicitly
        if (appointmentHour == 17) {
            throw new InvalidOperationException(
                "Technicians cannot be scheduled for appointments at 5:00 PM. Please choose an earlier time."
            );
        }
        
        // Get service duration (fallback to defaults if missing)
        int durationMinutes = resolveDurationMinutes(job);
        int requiredSlots = calculateRequiredSlots(durationMinutes);

        // Ensure the remaining day has enough discrete slots (5 total: 9, 11, 13, 15, 17)
        int startIndex = hourToSlotIndex(appointmentHour);
        int totalSlotsInDay = 5;
        if (startIndex < 0 || startIndex + requiredSlots > totalSlotsInDay) {
            throw new InvalidOperationException(
                "Not enough remaining time on this day for the requested service at " + appointmentTime +
                " (requires " + requiredSlots + " slot(s)). Choose an earlier start time."
            );
        }
        
        // Special validation for INSTALLATION (4 hours) - must start at 9, 11, or 13 to finish by 17:00
        if (job.getJobType() == JobType.INSTALLATION) {
            if (appointmentHour != 9 && appointmentHour != 11 && appointmentHour != 13) {
                throw new InvalidOperationException(
                    "Cellar installation requires 4 hours and must start at exactly 9:00 AM, 11:00 AM, or 1:00 PM " +
                    "to complete within working hours (by 5:00 PM). Requested start time: " + appointmentHour + ":00"
                );
            }
        }
        
        // Note: For INSTALLATION type, the appointment will end exactly at 17:00 (5:00 PM)
        // No 30-minute buffer is required after the installation ends
        
        // Find all scheduled appointments for this technician on this date
        List<Appointment> dayAppointments = appointmentRepository.findByTechnicianAndDateAndScheduled(
            technician, appointmentDate
        );
        
        // Calculate the end time of the new appointment
        LocalTime appointmentEnd = appointmentTime.plusMinutes(durationMinutes);
        
        // Minimum buffer time between appointments (30 minutes)
        final int BUFFER_MINUTES = 30;
        
        // Check for time range conflicts with existing appointments
        for (Appointment existing : dayAppointments) {
            // Skip the current appointment when updating (to avoid self-conflict)
            if (excludeAppointmentId != null && 
                existing.getAppointmentIdentifier().getAppointmentId().equals(excludeAppointmentId)) {
                continue;
            }
            
            LocalTime existingStart = existing.getAppointmentDate().toLocalTime();
            int existingDuration = resolveDurationMinutes(existing.getJob());
            LocalTime existingEnd = existingStart.plusMinutes(existingDuration);
            
            // Check for overlap first
            // Two ranges [start1, end1] and [start2, end2] overlap if: start1 < end2 AND start2 < end1
            boolean hasOverlap = appointmentTime.isBefore(existingEnd) && existingStart.isBefore(appointmentEnd);
            
            if (hasOverlap) {
                // Return error code that will be translated on the frontend
                throw new InvalidOperationException("TIME_CONFLICT");
            }
            
            // Calculate time gaps between appointments for buffer validation
            long minutesAfterExisting = java.time.Duration.between(existingEnd, appointmentTime).toMinutes();
            long minutesBeforeExisting = java.time.Duration.between(appointmentEnd, existingStart).toMinutes();
            
            // Check for insufficient buffer time (30 minutes minimum)
            // Case 1: New appointment is scheduled BEFORE the existing one (no overlap)
            // Allow exact back-to-back (0 minutes gap), warn if less than 30 minutes
            if (appointmentEnd.isBefore(existingStart) || appointmentEnd.equals(existingStart)) {
                // Only warn if there's a gap but it's less than 30 minutes
                if (minutesBeforeExisting > 0 && minutesBeforeExisting < BUFFER_MINUTES) {
                    // Store warning but don't throw - let it proceed with warning
                    System.out.println("WARNING: Buffer less than 30 minutes. Gap: " + minutesBeforeExisting + " minutes");
                }
            }
            
            // Case 2: New appointment is scheduled AFTER the existing one (no overlap)
            // Allow exact back-to-back (0 minutes gap), warn if less than 30 minutes
            if (existingEnd.isBefore(appointmentTime) || existingEnd.equals(appointmentTime)) {
                // Only warn if there's a gap but it's less than 30 minutes
                if (minutesAfterExisting > 0 && minutesAfterExisting < BUFFER_MINUTES) {
                    // Store warning but don't throw - let it proceed with warning
                    System.out.println("WARNING: Buffer less than 30 minutes. Gap: " + minutesAfterExisting + " minutes");
                }
            }
        }
    }

    /**
     * Validates that the appointment time matches the technician's available schedule
     * Checks both specific date overrides and regular day-of-week schedules
     */
    public void validateTechnicianSchedule(Employee technician, LocalDateTime appointmentDateTime) {
        LocalDate appointmentDate = appointmentDateTime.toLocalDate();
        int appointmentHour = appointmentDateTime.getHour();
        
        // Convert appointment hour to TimeSlotType
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType requiredTimeSlot = 
            mapHourToTimeSlotType(appointmentHour);
        
        if (requiredTimeSlot == null) {
            throw new InvalidOperationException(
                "Invalid appointment time. Valid times are: 9:00 AM, 11:00 AM, 1:00 PM, 3:00 PM, 5:00 PM"
            );
        }
        
        // First, check for specific date schedules (overrides)
        List<Schedule> specificDateSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(
            technician.getEmployeeIdentifier().getEmployeeId(),
            appointmentDate
        );
        
        if (!specificDateSchedules.isEmpty()) {
            // Specific date schedule exists - check if time slot is available
            boolean timeSlotAvailable = specificDateSchedules.stream()
                .anyMatch(schedule -> schedule.getTimeSlot().getTimeslot() == requiredTimeSlot);
            
            if (!timeSlotAvailable) {
                throw new InvalidOperationException(
                    "Technician " + technician.getFirstName() + " " + technician.getLastName() + 
                    " is not available at " + requiredTimeSlot.getDisplayTime() + " on " + appointmentDate + 
                    ". Please check their available time slots for this date."
                );
            }
        } else {
            // No specific date schedule - check regular day-of-week schedule
            java.time.DayOfWeek javaDayOfWeek = appointmentDate.getDayOfWeek();
            com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType scheduleDay = 
                mapJavaDayToScheduleDay(javaDayOfWeek);
            
            // Get all schedules for this technician
            List<Schedule> allSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(
                technician.getEmployeeIdentifier().getEmployeeId()
            );
            
            // Filter for the specific day of week and check if time slot is available
            boolean timeSlotAvailable = allSchedules.stream()
                .filter(schedule -> schedule.getSpecificDate() == null) // Regular schedules only
                .filter(schedule -> schedule.getDayOfWeek().getDayOfWeek() == scheduleDay)
                .anyMatch(schedule -> schedule.getTimeSlot().getTimeslot() == requiredTimeSlot);
            
            if (!timeSlotAvailable) {
                throw new InvalidOperationException(
                    "Technician " + technician.getFirstName() + " " + technician.getLastName() + 
                    " is not available at " + requiredTimeSlot.getDisplayTime() + " on " + javaDayOfWeek + "s. " +
                    "Please check their available time slots."
                );
            }
        }
    }

    /**
     * Calculate required time slots (in hours) based on duration in minutes
     */
    private int calculateRequiredSlots(int durationMinutes) {
        // Business rule: Each slot is 2 hours (120 minutes)
        // Calculate how many 2-hour slots are needed
        // Examples:
        // - 30 min (QUOTATION) = 1 slot
        // - 60 min (MAINTENANCE) = 1 slot
        // - 90 min (REPARATION) = 1 slot
        // - 120 min = 1 slot
        // - 121-240 min = 2 slots
        // - 240 min (INSTALLATION) = 2 slots (exactly fits 13:00-17:00)
        // - 241-360 min = 3 slots
        final int MINUTES_PER_SLOT = 120;
        return (int) Math.ceil((double) durationMinutes / MINUTES_PER_SLOT);
    }

    /**
     * Resolve duration in minutes, falling back to defaults per job type when null.
     */
    private int resolveDurationMinutes(Job job) {
        Integer duration = job.getEstimatedDurationMinutes();
        if (duration != null) {
            return duration;
        }

        // Fallback defaults by job type
        return switch (job.getJobType()) {
            case QUOTATION -> 30;
            case MAINTENANCE -> 60;
            case REPARATION -> 90;
            case INSTALLATION -> 240;
        };
    }

    /**
     * Convert hour to slot index
     * 9 AM = 0, 11 AM = 1, 1 PM = 2, 3 PM = 3, 5 PM = 4
     */
    private int hourToSlotIndex(int hour) {
        return switch (hour) {
            case 9 -> 0;
            case 11 -> 1;
            case 13 -> 2;
            case 15 -> 3;
            case 17 -> 4;
            default -> -1;
        };
    }

    /**
     * Validates that the cellar belongs to the customer making the appointment
     */
    public void validateCellarOwnership(Cellar cellar, Customer customer) {
        if (cellar == null) {
            throw new InvalidOperationException("Cellar not found.");
        }
        
        if (cellar.getOwnerCustomerIdentifier() == null || 
            !cellar.getOwnerCustomerIdentifier().getCustomerId().equals(customer.getCustomerIdentifier().getCustomerId())) {
            throw new InvalidOperationException(
                "Cellar '" + cellar.getName() + "' does not belong to customer. " +
                "You can only book appointments for cellars you own."
            );
        }
    }

    /**
     * Map appointment hour to TimeSlotType enum
     */
    private com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType mapHourToTimeSlotType(int hour) {
        return switch (hour) {
            case 9 -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType.NINE_AM;
            case 11 -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType.ELEVEN_AM;
            case 13 -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType.ONE_PM;
            case 15 -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType.THREE_PM;
            case 17 -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType.FIVE_PM;
            default -> null;
        };
    }

    /**
     * Map Java DayOfWeek to Schedule DayOfWeekType
     * Note: Weekends (Saturday/Sunday) are blocked at appointment creation time,
     * so this method should never receive weekend days
     */
    private com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType mapJavaDayToScheduleDay(
            java.time.DayOfWeek javaDayOfWeek) {
        return switch (javaDayOfWeek) {
            case MONDAY -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType.MONDAY;
            case TUESDAY -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType.TUESDAY;
            case WEDNESDAY -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType.WEDNESDAY;
            case THURSDAY -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType.THURSDAY;
            case FRIDAY -> com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType.FRIDAY;
            case SATURDAY, SUNDAY -> throw new InvalidOperationException(
                "Appointments cannot be scheduled on weekends. This should have been caught earlier."
            );
        };
    }
        /**
         * Duplicate service validation for update: excludes current appointment from check
         * Only validates that duplicate QUOTATIONS are not created - other services can coexist
         */
        public void validateDuplicateServiceAddressAndDayExcludeCurrent(
                JobType jobType,
                AppointmentRequestModel requestModel,
                LocalDate appointmentDate,
                LocalDateTime appointmentDateTime,
                Customer customer,
                String currentAppointmentId) {
            // Only restrict duplicate QUOTATIONS at the same address on the same day
            if (jobType != JobType.QUOTATION) {
                return; // Allow other services to be scheduled at same address on same day
            }
            validateDuplicateQuotation(jobType, requestModel, appointmentDate, appointmentDateTime, customer, currentAppointmentId);
        }

        /**
         * Duplicate service validation: only prevents duplicate QUOTATIONS
         * Allows multiple different services at the same address on the same day
         */
        public void validateDuplicateServiceAddressAndDay(
                JobType jobType,
                AppointmentRequestModel requestModel,
                LocalDate appointmentDate) {
            // Only restrict duplicate QUOTATIONS at the same address on the same day
            if (jobType != JobType.QUOTATION) {
                return; // Allow other services to be scheduled at same address on same day
            }
        }

    /**
     * Validates that the appointment postal code corresponds to either Quebec (QC) or Ontario (ON) province.
     * Uses the postal code format to determine the province:
     * - Quebec postal codes start with: G, H, J
     * - Ontario postal codes start with: K, L, M, N, P
     *
     * @param appointmentAddress the appointment address containing postal code and province
     * @throws InvalidOperationException if the postal code doesn't match the specified province
     *                                   or if the province is not Quebec or Ontario
     */
    public void validateProvinceRestriction(AppointmentAddress appointmentAddress) {
        if (appointmentAddress == null || appointmentAddress.getPostalCode() == null) {
            throw new InvalidOperationException("Appointment address and postal code are required.");
        }

        String province = appointmentAddress.getProvince() != null ? 
            appointmentAddress.getProvince().trim().toUpperCase() : "";
        String postalCode = appointmentAddress.getPostalCode().trim().toUpperCase();

        // Valid provinces for appointments
        if (!province.equals("QC") && !province.equals("ON") && 
            !province.equals("QUEBEC") && !province.equals("ONTARIO")) {
            throw new InvalidOperationException(
                "Appointments can only be scheduled in Quebec (QC) or Ontario (ON) provinces. " +
                "Provided province: " + appointmentAddress.getProvince()
            );
        }

        // Validate postal code format matches the province
        if (postalCode.isEmpty()) {
            throw new InvalidOperationException("Postal code is required.");
        }

        char firstChar = postalCode.charAt(0);

        // Quebec postal codes start with G, H, or J
        boolean isQuebecPostalCode = firstChar == 'G' || firstChar == 'H' || firstChar == 'J';

        // Ontario postal codes start with K, L, M, N, or P
        boolean isOntarioPostalCode = firstChar == 'K' || firstChar == 'L' || 
                                     firstChar == 'M' || firstChar == 'N' || firstChar == 'P';

        // Check if postal code matches the specified province
        if ((province.equals("QC") || province.equals("QUEBEC")) && !isQuebecPostalCode) {
            throw new InvalidOperationException(
                "Postal code does not match Quebec province. Quebec postal codes start with G, H, or J. " +
                "Provided postal code: " + appointmentAddress.getPostalCode()
            );
        }

        if ((province.equals("ON") || province.equals("ONTARIO")) && !isOntarioPostalCode) {
            throw new InvalidOperationException(
                "Postal code does not match Ontario province. Ontario postal codes start with K, L, M, N, or P. " +
                "Provided postal code: " + appointmentAddress.getPostalCode()
            );
        }

        // If postal code doesn't match either province format, reject it
        if (!isQuebecPostalCode && !isOntarioPostalCode) {
            throw new InvalidOperationException(
                "Postal code must be from Quebec or Ontario. " +
                "Provided postal code: " + appointmentAddress.getPostalCode()
            );
        }
    }
}
