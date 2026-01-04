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
        
        // Skip validation if the job itself is a quotation
        if (jobType == JobType.QUOTATION) {
            return;
        }
        
        AppointmentAddress address = requestModel.getAppointmentAddress();
        LocalDate serviceDate = appointmentDateTime.toLocalDate();
        
        // Find all quotations at this address on this day (regardless of customer)
        List<Appointment> quotationsOnSameDay = appointmentRepository.findQuotationsByAddressAndDate(
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode(),
            serviceDate
        );
        
        // If no quotation exists at this address on this day, allow service
        if (quotationsOnSameDay.isEmpty()) {
            return;
        }
        
        // Check for SCHEDULED quotations only - services cannot be scheduled AFTER them
        // COMPLETED quotations allow services to be scheduled after
        for (Appointment quotation : quotationsOnSameDay) {
            if (quotation.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.SCHEDULED) {
                LocalDateTime quotationDateTime = quotation.getAppointmentDate();
                
                // Block if service is scheduled AT or AFTER a SCHEDULED quotation time
                if (appointmentDateTime.isAfter(quotationDateTime) || appointmentDateTime.isEqual(quotationDateTime)) {
                    String quotationCustomerId = quotation.getCustomer().getCustomerIdentifier().getCustomerId();
                    throw new InvalidOperationException(
                        "ERROR_QUOTATION_SCHEDULED_AFTER"
                    );
                }
            }
        }
        
        // Service is before all scheduled quotations OR quotations are completed, allow it
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
                    "to complete within working hours (before 5:00 PM). Requested start time: " + appointmentHour + ":00"
                );
            }
        }
        
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
                throw new InvalidOperationException(
                    "Time conflict: The technician already has an appointment from " + 
                    existingStart + " to " + existingEnd + ". " +
                    "Your requested appointment from " + appointmentTime + " to " + appointmentEnd + 
                    " overlaps with this existing appointment."
                );
            }
            
            // Calculate time gaps between appointments for buffer validation
            long minutesAfterExisting = java.time.Duration.between(existingEnd, appointmentTime).toMinutes();
            long minutesBeforeExisting = java.time.Duration.between(appointmentEnd, existingStart).toMinutes();
            
            // Check for insufficient buffer time (30 minutes minimum)
            // Case 1: New appointment is scheduled BEFORE the existing one (no overlap)
            if (appointmentEnd.isBefore(existingStart) || appointmentEnd.equals(existingStart)) {
                // Need at least 30 minutes gap
                if (minutesBeforeExisting < BUFFER_MINUTES) {
                    throw new InvalidOperationException(
                        "Insufficient time between appointments: Your appointment ending at " + appointmentEnd + 
                        " leaves only " + minutesBeforeExisting + " minute(s) before the next appointment at " + existingStart + ". " +
                        "At least " + BUFFER_MINUTES + " minutes buffer is required between appointments."
                    );
                }
            }
            
            // Case 2: New appointment is scheduled AFTER the existing one (no overlap)
            if (existingEnd.isBefore(appointmentTime) || existingEnd.equals(appointmentTime)) {
                // Need at least 30 minutes gap
                if (minutesAfterExisting < BUFFER_MINUTES) {
                    throw new InvalidOperationException(
                        "Insufficient time between appointments: An existing appointment ending at " + existingEnd + 
                        " leaves only " + minutesAfterExisting + " minute(s) before your requested start time of " + appointmentTime + ". " +
                        "At least " + BUFFER_MINUTES + " minutes buffer is required between appointments."
                    );
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
        // Business rule: 
        // - <=90 minutes fits in the current slot (1 slot)
        // - >90 minutes: 1 slot + ceil((duration - 90) / 60) additional slots
        // Examples:
        // - 90 min = 1 slot (9-11 AM covers it)
        // - 91-150 min = 2 slots (9-11 AM + 11-1 PM = 4 hours covers anything up to 150 min)
        // - 151-210 min = 3 slots
        if (durationMinutes <= 90) {
            return 1;
        }
        return 1 + (int) Math.ceil((durationMinutes - 90) / 60.0);
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
         */
        public void validateDuplicateServiceAddressAndDayExcludeCurrent(
                JobType jobType,
                AppointmentRequestModel requestModel,
                LocalDate appointmentDate,
                String currentAppointmentId) {
            if (jobType == JobType.QUOTATION) {
                return; // handled by quotation logic
            }
            AppointmentAddress address = requestModel.getAppointmentAddress();
            List<AppointmentStatusType> blockingStatuses = Arrays.asList(
                AppointmentStatusType.SCHEDULED
            );
            List<Appointment> existingServices = appointmentRepository.findByAddressAndDateAndStatusIn(
                address.getStreetAddress(),
                address.getCity(),
                address.getProvince(),
                address.getPostalCode(),
                appointmentDate,
                blockingStatuses
            );
            boolean serviceExists = existingServices.stream()
                .anyMatch(a -> a.getJob() != null
                    && a.getJob().getJobType() != JobType.QUOTATION
                    && !a.getAppointmentIdentifier().getAppointmentId().equals(currentAppointmentId));
            if (serviceExists) {
                throw new InvalidOperationException(
                    "ERROR_SERVICE_EXISTS"
                );
            }
        }

    public void validateDuplicateServiceAddressAndDay(
            JobType jobType,
            AppointmentRequestModel requestModel,
            LocalDate appointmentDate) {
        if (jobType == JobType.QUOTATION) {
            return; // handled by quotation logic
        }
        AppointmentAddress address = requestModel.getAppointmentAddress();
        List<AppointmentStatusType> blockingStatuses = Arrays.asList(
            AppointmentStatusType.SCHEDULED
        );
        List<Appointment> existingServices = appointmentRepository.findByAddressAndDateAndStatusIn(
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode(),
            appointmentDate,
            blockingStatuses
        );
        // Only block if the job type is not QUOTATION and the existing appointment is also not a quotation
        boolean serviceExists = existingServices.stream()
            .anyMatch(a -> a.getJob() != null && a.getJob().getJobType() != JobType.QUOTATION);
        if (serviceExists) {
            throw new InvalidOperationException(
                "ERROR_SERVICE_EXISTS"
            );
        }
    }
}
