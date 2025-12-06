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

    /**
     * Validates booking deadline rules:
     * - For AM appointments (9h, 11h): must book by 5 PM (17h) the previous day
     * - For PM appointments (13h, 15h, 17h): must book by 9 AM the same day
     */
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

    /**
     * Validates role-based service type restrictions:
     * - Customers can ONLY book QUOTATION
     * - Technicians can book INSTALLATION, REPARATION, MAINTENANCE, or QUOTATION
     */
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

    /**
     * Validates duplicate address and day logic with comprehensive status checks:
     * - Only one appointment per day per address
     * - SCHEDULED or COMPLETED appointments block new appointments
     * - Only CANCELLED appointments allow rebooking
     */
    public void validateDuplicateAddressAndDay(
            AppointmentRequestModel requestModel, 
            LocalDate appointmentDate,
            Customer customer,
            Employee technician) {
        
        AppointmentAddress address = requestModel.getAppointmentAddress();
        
        // Find appointments at same address on same day (SCHEDULED or COMPLETED status)
        List<AppointmentStatusType> blockingStatuses = Arrays.asList(
            AppointmentStatusType.SCHEDULED, 
            AppointmentStatusType.COMPLETED
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

    /**
     * Validates that only ONE QUOTATION is allowed per address per day.
     * Other services can coexist at different time slots.
     */
    public void validateDuplicateQuotation(
            JobType jobType,
            AppointmentRequestModel requestModel,
            LocalDate appointmentDate,
            Customer customer) {
        
        // Only validate if the current job is a quotation
        if (jobType != JobType.QUOTATION) {
            return;
        }
        
        AppointmentAddress address = requestModel.getAppointmentAddress();
        
        // Find existing quotations at same address on same day (SCHEDULED or COMPLETED status)
        List<AppointmentStatusType> blockingStatuses = Arrays.asList(
            AppointmentStatusType.SCHEDULED, 
            AppointmentStatusType.COMPLETED
        );
        
        List<Appointment> existingQuotations = appointmentRepository.findQuotationsByCustomerAndAddress(
            customer,
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode()
        );
        
        // Filter by date and status
        List<Appointment> quotationsOnSameDay = existingQuotations.stream()
            .filter(apt -> apt.getAppointmentDate().toLocalDate().equals(appointmentDate))
            .filter(apt -> blockingStatuses.contains(apt.getAppointmentStatus().getAppointmentStatusType()))
            .toList();
        
        if (!quotationsOnSameDay.isEmpty()) {
            Appointment blocking = quotationsOnSameDay.get(0);
            
            throw new InvalidOperationException(
                "A quotation already exists for this address on " + appointmentDate + 
                " at " + blocking.getAppointmentDate().toLocalTime() + 
                ". Status: " + blocking.getAppointmentStatus().getAppointmentStatusType() + ". " +
                "Only one quotation per address per day is allowed. " +
                "Please choose a different date or cancel the existing quotation."
            );
        }
    }

    /**
     * Validates that non-quotation services scheduled AFTER a quotation require it to be completed first.
     * Business Rules:
     * 1. If there's a COMPLETED quotation at the address → Allow service
     * 2. If there's a SCHEDULED quotation AND service is AFTER the quotation time → Block (must complete quotation first)
     * 3. If there's a SCHEDULED quotation AND service is BEFORE the quotation → Allow (service doesn't depend on quotation)
     * 4. If there's NO quotation at all → Allow (technician already knows the issue)
     * Note: Same time appointments are blocked by the duplicate address/day validation
     */
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
        
        // Find all quotations for this customer at this address
        List<Appointment> quotations = appointmentRepository.findQuotationsByCustomerAndAddress(
            customer,
            address.getStreetAddress(),
            address.getCity(),
            address.getProvince(),
            address.getPostalCode()
        );
        
        // If no quotation exists, technician already knows the issue - allow service
        if (quotations.isEmpty()) {
            return;
        }
        
        // Check for SCHEDULED quotations ON THE SAME DAY ONLY
        List<Appointment> scheduledQuotationsOnSameDay = quotations.stream()
            .filter(apt -> apt.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.SCHEDULED)
            .filter(apt -> apt.getAppointmentDate().toLocalDate().equals(serviceDate))
            .toList();

        if (!scheduledQuotationsOnSameDay.isEmpty()) {
            // Block if the service is after any scheduled quotation on that same day
            for (Appointment scheduledQuotation : scheduledQuotationsOnSameDay) {
                LocalDateTime quotationDateTime = scheduledQuotation.getAppointmentDate();

                if (appointmentDateTime.isAfter(quotationDateTime)) {
                    throw new InvalidOperationException(
                        "Cannot schedule " + jobType + " service at " + appointmentDateTime.toLocalTime() +
                        " on " + serviceDate + ". " +
                        "There is a SCHEDULED quotation at " + quotationDateTime.toLocalTime() +
                        " on the same day that must be completed first. " +
                        "You can either: 1) Complete the quotation first, or 2) Schedule the service before the quotation time. " +
                        "Address: " + address.getStreetAddress() + ", " + address.getCity()
                    );
                }
            }
        }

        // If no blocking scheduled quotations on the same day, allow service when a quotation is already completed
        boolean hasCompletedQuotation = quotations.stream()
            .anyMatch(apt -> apt.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.COMPLETED);

        if (hasCompletedQuotation) {
            return; // Quotation completed, allow service
        }

        // Otherwise, proceed (no quotation or only future-time scheduled quotation on that day)
    }

    /**
     * Validates time slot availability based on service duration:
     * - QUOTATION: 30 min (1 slot)
     * - MAINTENANCE: 60 min (2 slots - takes current hour + next hour)
     * - REPARATION: 90 min (2 slots - takes current hour + next hour)
     * - INSTALLATION: 240 min (4 slots - must start at exactly 9 AM, 11 AM, or 1 PM to finish by 5 PM)
     */
    public void validateTimeSlotAvailability(Employee technician, LocalDateTime appointmentDateTime, Job job) {
        LocalDate appointmentDate = appointmentDateTime.toLocalDate();
        LocalTime appointmentTime = appointmentDateTime.toLocalTime();
        int appointmentHour = appointmentTime.getHour();
        
        // Validate that appointment is at a valid time slot (technician availability: 9, 11, 13, 15, 17)
        if (appointmentHour != 9 && appointmentHour != 11 && appointmentHour != 13 && 
            appointmentHour != 15 && appointmentHour != 17) {
            throw new InvalidOperationException(
                "Appointments can only be scheduled at 9:00 AM, 11:00 AM, 1:00 PM, 3:00 PM, or 5:00 PM. " +
                "Requested time: " + appointmentHour + ":00"
            );
        }
        
        // Get service duration
        int durationMinutes = job.getEstimatedDurationMinutes();
        int requiredSlots = calculateRequiredSlots(durationMinutes);
        
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
        
        // Check for time slot conflicts
        for (Appointment existing : dayAppointments) {
            LocalTime existingTime = existing.getAppointmentDate().toLocalTime();
            int existingHour = existingTime.getHour();
            int existingDuration = existing.getJob().getEstimatedDurationMinutes();
            int existingSlots = calculateRequiredSlots(existingDuration);
            
            // Check if time slots overlap
            if (timeSlotsOverlap(appointmentHour, requiredSlots, existingHour, existingSlots)) {
                throw new InvalidOperationException(
                    "Time slot conflict: The technician already has an appointment at " + 
                    existingTime + " which requires " + existingSlots + " hour(s). " +
                    "Your requested time at " + appointmentTime + " requires " + requiredSlots + " hour(s) and overlaps."
                );
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
        // QUOTATION (30 min) = 1 slot
        // MAINTENANCE (60 min) = 2 slots  
        // REPARATION (90 min) = 2 slots
        // INSTALLATION (240 min) = 4 slots
        if (durationMinutes <= 30) {
            return 1;
        } else if (durationMinutes <= 90) {
            return 2; // Takes 2 hour slots
        } else {
            return (int) Math.ceil(durationMinutes / 60.0);
        }
    }

    /**
     * Check if two time slots overlap
     * Since time slots are discrete (9, 11, 13, 15, 17) with 2-hour intervals,
     * we need to calculate which discrete slots are occupied
     */
    private boolean timeSlotsOverlap(int startHour1, int slots1, int startHour2, int slots2) {
        // Calculate the discrete time slots occupied by each appointment
        // Time slots are: 9, 11, 13, 15, 17 (indices: 0, 1, 2, 3, 4)
        
        // Get occupied slot indices for appointment 1
        int[] occupiedSlots1 = getOccupiedSlotIndices(startHour1, slots1);
        int[] occupiedSlots2 = getOccupiedSlotIndices(startHour2, slots2);
        
        // Check if any slots overlap
        for (int slot1 : occupiedSlots1) {
            for (int slot2 : occupiedSlots2) {
                if (slot1 == slot2) {
                    return true; // Overlap found
                }
            }
        }
        
        return false; // No overlap
    }
    
    /**
     * Get the array of discrete slot indices occupied by an appointment
     * Slot indices: 9=0, 11=1, 13=2, 15=3, 17=4
     */
    private int[] getOccupiedSlotIndices(int startHour, int slots) {
        int startIndex = hourToSlotIndex(startHour);
        int[] occupied = new int[slots];
        
        for (int i = 0; i < slots; i++) {
            occupied[i] = startIndex + i;
        }
        
        return occupied;
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
}
