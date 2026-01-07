package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatus;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.MissingDataException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleResponseMapper responseMapper;
    private final EmployeeScheduleRequestMapper requestMapper;
    private final AppointmentRepository appointmentRepository;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, EmployeeRepository employeeRepository, EmployeeScheduleResponseMapper responseMapper, EmployeeScheduleRequestMapper requestMapper, AppointmentRepository appointmentRepository) {
        this.scheduleRepository = scheduleRepository;
        this.employeeRepository = employeeRepository;
        this.responseMapper = responseMapper;
        this.requestMapper = requestMapper;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public List<EmployeeScheduleResponseModel> getEmployeeSchedule(String employeeId) {

        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);

        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }

        List<Schedule> schedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);

        // Filter to only include weekly template schedules (where specific_date is null)
        Map<DayOfWeekType, List<Schedule>> schedulesByDay = schedules.stream()
                .filter(s -> s.getSpecificDate() == null)  // Only weekly templates
                .collect(Collectors.groupingBy(s -> s.getDayOfWeek().getDayOfWeek()));


        List<EmployeeScheduleResponseModel> groupedResponses = schedulesByDay.entrySet().stream()
                .map(entry -> {
                    DayOfWeekType day = entry.getKey();
                    List<Schedule> daySchedules = entry.getValue();
                    List<String> sortedTimeSlots = daySchedules.stream()
                            .map(s -> s.getTimeSlot().getTimeslot())
                            .sorted(Comparator.comparing(TimeSlotType::ordinal))
                            .map(TimeSlotType::getDisplayTime)
                            .collect(Collectors.toList());
                    EmployeeScheduleResponseModel response = new EmployeeScheduleResponseModel();
                    response.setEmployeeId(employeeId);
                    response.setDayOfWeek(day);
                    response.setTimeSlots(sortedTimeSlots);

                    return response;
                })
                .sorted(Comparator.comparing(r -> r.getDayOfWeek().ordinal()))
                .collect(Collectors.toList());

        return groupedResponses;
    }

    @Override
    public List<EmployeeScheduleResponseModel> getEmployeeScheduleForDate(String employeeId, String date) {
        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }

        // Parse date
        LocalDateTime targetDate;
        try {
            targetDate = LocalDateTime.parse(date + "T00:00:00");
        } catch (Exception e) {
            throw new InvalidOperationException("Invalid date format. Expected format: YYYY-MM-DD (e.g., 2025-12-05)");
        }
        
        LocalDate specificDate = targetDate.toLocalDate();
        DayOfWeekType dayOfWeek = getDayOfWeekFromDate(targetDate);

        // Get date-specific schedules
        List<Schedule> dateSpecificSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(employeeId, specificDate);
        
        // If date-specific schedules exist, return them
        if (!dateSpecificSchedules.isEmpty()) {
            List<String> sortedTimeSlots = dateSpecificSchedules.stream()
                .filter(s -> s.getTimeSlot() != null && s.getTimeSlot().getTimeslot() != null)
                .map(s -> s.getTimeSlot().getTimeslot())
                .sorted(Comparator.comparing(TimeSlotType::ordinal))
                .map(TimeSlotType::getDisplayTime)
                .collect(Collectors.toList());
            
            EmployeeScheduleResponseModel response = new EmployeeScheduleResponseModel();
            response.setEmployeeId(employeeId);
            response.setDayOfWeek(dayOfWeek);
            response.setTimeSlots(sortedTimeSlots);
            return List.of(response);
        }
        
        // Otherwise, return weekly template schedules for that day
        List<Schedule> allSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);
        List<Schedule> weeklySchedules = allSchedules.stream()
            .filter(s -> s.getSpecificDate() == null)
            .filter(s -> s.getDayOfWeek() != null && s.getDayOfWeek().getDayOfWeek() != null)
            .filter(s -> s.getDayOfWeek().getDayOfWeek().equals(dayOfWeek))
            .collect(Collectors.toList());
        
        if (weeklySchedules.isEmpty()) {
            return List.of();
        }
        
        List<String> sortedTimeSlots = weeklySchedules.stream()
            .filter(s -> s.getTimeSlot() != null && s.getTimeSlot().getTimeslot() != null)
            .map(s -> s.getTimeSlot().getTimeslot())
            .sorted(Comparator.comparing(TimeSlotType::ordinal))
            .map(TimeSlotType::getDisplayTime)
            .collect(Collectors.toList());
        
        EmployeeScheduleResponseModel response = new EmployeeScheduleResponseModel();
        response.setEmployeeId(employeeId);
        response.setDayOfWeek(dayOfWeek);
        response.setTimeSlots(sortedTimeSlots);
        return List.of(response);
    }

    @Override
    public List<EmployeeScheduleResponseModel> addEmployeeSchedule(String employeeId, List<EmployeeScheduleRequestModel> scheduleRequests) {

        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }

        if (Boolean.FALSE.equals(employee.getIsActive())) {
            throw new InvalidOperationException("Cannot add schedule for deactivated employee " + employeeId + ".");
        }

        List<Schedule> existingSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);
        if (existingSchedules != null && !existingSchedules.isEmpty()) {
            throw new ResourceAlreadyExistsException("Employee " + employeeId + " already has a schedule. Cannot add a new schedule.");
        }
        if (scheduleRequests == null || scheduleRequests.isEmpty()) {
            throw new MissingDataException("Schedule requests cannot be null or empty.");
        }

        Set<DayOfWeekType> providedDays = scheduleRequests.stream()
                .map(EmployeeScheduleRequestModel::getDayOfWeek)
                .collect(Collectors.toSet());

        Set<DayOfWeekType> requiredDays = EnumSet.allOf(DayOfWeekType.class);

        if (!providedDays.containsAll(requiredDays)) {
            Set<DayOfWeekType> missingDays = new HashSet<>(requiredDays);
            missingDays.removeAll(providedDays);
            throw new MissingDataException("All 5 days of the week must be provided. Missing days: " + missingDays);
        }

        for (EmployeeScheduleRequestModel request : scheduleRequests) {
            if (request.getDayOfWeek() == null) {
                throw new MissingDataException("Day of week cannot be null in schedule request.");
            }
            if (request.getTimeSlots() == null || request.getTimeSlots().isEmpty()) {
                throw new MissingDataException("Day " + request.getDayOfWeek() + " must have at least one time slot.");
            }
            for (TimeSlotType timeSlot : request.getTimeSlots()) {
                if (timeSlot == null) {
                    throw new MissingDataException("Time slot cannot be null for day " + request.getDayOfWeek());
                }
            }

                boolean isTechnician = employee.getEmployeeRole() != null &&
                    employee.getEmployeeRole().getEmployeeRoleType() == com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN;

            if (!isTechnician) {
                if (request.getTimeSlots().size() != 2) {
                    throw new MissingDataException("Non-technician employees must provide exactly 2 time slots per day: start and end times.");
                }
                List<TimeSlotType> sorted = request.getTimeSlots().stream().sorted(Comparator.comparingInt(this::toMinutes)).toList();
                if (sorted.get(0) != TimeSlotType.NINE_AM) {
                    throw new MissingDataException("Non-technician employees must start at NINE_AM (9:00 AM).");
                }
                int startMinutes = toMinutes(sorted.get(0));
                int endMinutes = toMinutes(sorted.get(1));
                int dailyHours = (endMinutes - startMinutes) / 60;
                if (dailyHours > 8) {
                    throw new MissingDataException("Non-technician employees cannot work more than 8 hours per day. Day: " + request.getDayOfWeek() + ", Hours: " + dailyHours);
                }
            } else {
                // Block FIVE_PM slot for technicians
                if (request.getTimeSlots().contains(TimeSlotType.FIVE_PM)) {
                    throw new MissingDataException("Technicians cannot have a time slot at 5:00 PM. Day: " + request.getDayOfWeek());
                }
                List<Integer> minutes = request.getTimeSlots().stream()
                        .map(this::toMinutes)
                        .sorted()
                        .toList();
                for (int i = 1; i < minutes.size(); i++) {
                    if (minutes.get(i) - minutes.get(i - 1) < 120) {
                        throw new MissingDataException("Technician time slots must be at least 2 hours apart.");
                    }
                }
                if (request.getTimeSlots().size() > 4) {
                    throw new MissingDataException("Technician cannot exceed 8 hours in a single day (max 4 slots of 2h each). Day: " + request.getDayOfWeek());
                }
            }
        }
        boolean isTechnician = employee.getEmployeeRole() != null &&
                employee.getEmployeeRole().getEmployeeRoleType() == com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN;

        int totalHours;
        if (isTechnician) {
            int totalSlots = scheduleRequests.stream()
                    .mapToInt(r -> r.getTimeSlots() == null ? 0 : r.getTimeSlots().size())
                    .sum();
            totalHours = totalSlots * 2;
        } else {
            totalHours = 0;
            for (EmployeeScheduleRequestModel request : scheduleRequests) {
                List<TimeSlotType> sorted = request.getTimeSlots().stream()
                        .sorted(Comparator.comparingInt(this::toMinutes))
                        .toList();
                int startMinutes = toMinutes(sorted.get(0));
                int endMinutes = toMinutes(sorted.get(1));
                int dailyHours = (endMinutes - startMinutes) / 60;
                totalHours += dailyHours;
            }
        }

        if (totalHours > 40) {
            throw new MissingDataException("Employee cannot exceed 40 hours in a 5-day week. Requested: " + totalHours + " hours.");
        }

        List<Schedule> schedulesToSave = new ArrayList<>();
        for (EmployeeScheduleRequestModel request : scheduleRequests) {
            List<Schedule> daySchedules = requestMapper.toEntityList(request);

            for (Schedule schedule : daySchedules) {
                if (schedule.getDayOfWeek() == null || schedule.getDayOfWeek().getDayOfWeek() == null) {
                    throw new MissingDataException("Day of week cannot be null in schedule entity.");
                }
                if (schedule.getTimeSlot() == null || schedule.getTimeSlot().getTimeslot() == null) {
                    throw new MissingDataException("Time slot cannot be null in schedule entity.");
                }
                
                schedule.setEmployee(employee);
                schedulesToSave.add(schedule);
            }
        }

        scheduleRepository.saveAll(schedulesToSave);

        return getEmployeeSchedule(employeeId);
    }


    @Override
    public List<EmployeeScheduleResponseModel> updateEmployeeSchedule(String employeeId, List<EmployeeScheduleRequestModel> scheduleRequests) {

        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }

        if (Boolean.FALSE.equals(employee.getIsActive())) {
            throw new InvalidOperationException("Cannot update schedule for deactivated employee " + employeeId + ".");
        }

        List<Schedule> existingSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);
        if (existingSchedules == null || existingSchedules.isEmpty()) {
            throw new ResourceNotFoundException("Employee " + employeeId + " does not have an existing schedule to update.");
        }

        // Check for existing scheduled appointments and verify they won't be removed
        List<Appointment> scheduledAppointments = appointmentRepository.findScheduledAppointmentsByTechnicianAndSchedules(employee, existingSchedules);
        
        // Also check for ALL SCHEDULED appointments on this technician (for date-specific appointments)
        List<Appointment> allScheduledAppointments = appointmentRepository.findAllByTechnician(employee).stream()
            .filter(a -> a.getAppointmentStatus() != null && 
                    a.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.SCHEDULED)
            .toList();
        
        if (!allScheduledAppointments.isEmpty()) {
            // Build map of new time slots per day
            Map<DayOfWeekType, Set<TimeSlotType>> newScheduleMap = new HashMap<>();
            for (EmployeeScheduleRequestModel request : scheduleRequests) {
                newScheduleMap.put(request.getDayOfWeek(), new HashSet<>(request.getTimeSlots()));
            }
            
            // Check each appointment to ensure its time slot is still available
            for (Appointment appointment : allScheduledAppointments) {
                TimeSlotType appointmentSlot = getTimeSlotFromAppointment(appointment);
                DayOfWeekType appointmentDay = getDayOfWeekFromDate(appointment.getAppointmentDate());

                Set<TimeSlotType> newSlotsForDay = newScheduleMap.get(appointmentDay);
                if (newSlotsForDay == null || !newSlotsForDay.contains(appointmentSlot)) {
                    throw new InvalidOperationException(
                            "Cannot update schedule: Employee has an existing appointment on "
                                    + appointmentDay + " at " + appointmentSlot.getDisplayTime() +
                                    " that would be removed by this schedule update. Please cancel or reschedule the appointment first."
                    );
                }
            }
        }

        if (scheduleRequests == null || scheduleRequests.isEmpty()) {
            throw new MissingDataException("Schedule requests cannot be null or empty.");
        }

        Set<DayOfWeekType> providedDays = scheduleRequests.stream()
                .map(EmployeeScheduleRequestModel::getDayOfWeek)
                .collect(Collectors.toSet());

        Set<DayOfWeekType> requiredDays = EnumSet.allOf(DayOfWeekType.class);

        if (!providedDays.containsAll(requiredDays)) {
            Set<DayOfWeekType> missingDays = new HashSet<>(requiredDays);
            missingDays.removeAll(providedDays);
            throw new MissingDataException("All 5 days of the week must be provided. Missing days: " + missingDays);
        }

        for (EmployeeScheduleRequestModel request : scheduleRequests) {
            if (request.getDayOfWeek() == null) {
                throw new MissingDataException("Day of week cannot be null in schedule request.");
            }
            if (request.getTimeSlots() == null || request.getTimeSlots().isEmpty()) {
                throw new MissingDataException("Day " + request.getDayOfWeek() + " must have at least one time slot.");
            }
            for (TimeSlotType timeSlot : request.getTimeSlots()) {
                if (timeSlot == null) {
                    throw new MissingDataException("Time slot cannot be null for day " + request.getDayOfWeek());
                }
            }

            boolean isTechnician = employee.getEmployeeRole() != null &&
                    employee.getEmployeeRole().getEmployeeRoleType() == com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN;

            if (!isTechnician) {
                if (request.getTimeSlots().size() != 2) {
                    throw new MissingDataException("Non-technician employees must provide exactly 2 time slots per day: start and end times.");
                }
                List<TimeSlotType> sorted = request.getTimeSlots().stream().sorted(Comparator.comparingInt(this::toMinutes)).toList();
                if (sorted.get(0) != TimeSlotType.NINE_AM) {
                    throw new MissingDataException("Non-technician employees must start at NINE_AM (9:00 AM).");
                }
                int startMinutes = toMinutes(sorted.get(0));
                int endMinutes = toMinutes(sorted.get(1));
                int dailyHours = (endMinutes - startMinutes) / 60;
                if (dailyHours > 8) {
                    throw new MissingDataException("Non-technician employees cannot work more than 8 hours per day. Day: " + request.getDayOfWeek() + ", Hours: " + dailyHours);
                }
            } else {
                List<Integer> minutes = request.getTimeSlots().stream()
                        .map(this::toMinutes)
                        .sorted()
                        .toList();
                for (int i = 1; i < minutes.size(); i++) {
                    if (minutes.get(i) - minutes.get(i - 1) < 120) {
                        throw new MissingDataException("Technician time slots must be at least 2 hours apart.");
                    }
                }
                if (request.getTimeSlots().size() > 4) {
                    throw new MissingDataException("Technician cannot exceed 8 hours in a single day (max 4 slots of 2h each). Day: " + request.getDayOfWeek());
                }
            }
        }

        boolean isTechnician = employee.getEmployeeRole() != null &&
                employee.getEmployeeRole().getEmployeeRoleType() == com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN;

        int totalHours;
        if (isTechnician) {
            int totalSlots = scheduleRequests.stream()
                    .mapToInt(r -> r.getTimeSlots() == null ? 0 : r.getTimeSlots().size())
                    .sum();
            totalHours = totalSlots * 2;
        } else {
            totalHours = 0;
            for (EmployeeScheduleRequestModel request : scheduleRequests) {
                List<TimeSlotType> sorted = request.getTimeSlots().stream()
                        .sorted(Comparator.comparingInt(this::toMinutes))
                        .toList();
                int startMinutes = toMinutes(sorted.get(0));
                int endMinutes = toMinutes(sorted.get(1));
                int dailyHours = (endMinutes - startMinutes) / 60;
                totalHours += dailyHours;
            }
        }

        if (totalHours > 40) {
            throw new MissingDataException("Employee cannot exceed 40 hours in a 5-day week. Requested: " + totalHours + " hours.");
        }

        // Separate weekly template schedules from date-specific schedules
        List<Schedule> weeklySchedules = existingSchedules.stream()
            .filter(s -> s.getSpecificDate() == null)
            .collect(Collectors.toList());
        
        List<Schedule> dateSpecificSchedules = existingSchedules.stream()
            .filter(s -> s.getSpecificDate() != null)
            .collect(Collectors.toList());

        // Collect all appointments BEFORE detaching (only from weekly schedules)
        List<Appointment> allAppointments = new ArrayList<>();
        for (Schedule existingSchedule : weeklySchedules) {
            allAppointments.addAll(appointmentRepository.findAllByTechnicianAndSchedule(employee, existingSchedule));
        }

        // Detach all appointments from existing weekly schedules before deletion
        for (Appointment appointment : allAppointments) {
            appointment.setSchedule(null);
            appointmentRepository.save(appointment);
        }

        // Delete only weekly template schedules (preserve date-specific schedules)
        scheduleRepository.deleteAll(weeklySchedules);

        // Create new schedules
        List<Schedule> schedulesToSave = new ArrayList<>();
        for (EmployeeScheduleRequestModel request : scheduleRequests) {
            List<Schedule> daySchedules = requestMapper.toEntityList(request);

            for (Schedule schedule : daySchedules) {
                if (schedule.getDayOfWeek() == null || schedule.getDayOfWeek().getDayOfWeek() == null) {
                    throw new MissingDataException("Day of week cannot be null in schedule entity.");
                }
                if (schedule.getTimeSlot() == null || schedule.getTimeSlot().getTimeslot() == null) {
                    throw new MissingDataException("Time slot cannot be null in schedule entity.");
                }
                
                schedule.setEmployee(employee);
                schedulesToSave.add(schedule);
            }
        }
        
        List<Schedule> savedSchedules = scheduleRepository.saveAll(schedulesToSave);

        // Reattach appointments to matching new schedules
        for (Appointment appointment : allAppointments) {
            // Find matching schedule by day and time slot
            DayOfWeekType appointmentDay;
            try {
                appointmentDay = getDayOfWeekFromDate(appointment.getAppointmentDate());
            } catch (InvalidOperationException e) {
                // Skip weekend appointments
                continue;
            }
            
            TimeSlotType appointmentSlot = getTimeSlotFromAppointment(appointment);
            
            Schedule matchingSchedule = savedSchedules.stream()
                .filter(s -> s.getDayOfWeek() != null && s.getDayOfWeek().getDayOfWeek() != null)
                .filter(s -> s.getDayOfWeek().getDayOfWeek().equals(appointmentDay))
                .filter(s -> s.getTimeSlot() != null && s.getTimeSlot().getTimeslot() != null)
                .filter(s -> s.getTimeSlot().getTimeslot().equals(appointmentSlot))
                .findFirst()
                .orElse(null);
            
            if (matchingSchedule != null) {
                appointment.setSchedule(matchingSchedule);
                appointmentRepository.save(appointment);
            }
        }

        return getEmployeeSchedule(employeeId);
    }

    private int toMinutes(TimeSlotType slot) {
        return switch (slot) {
            case NINE_AM -> 9 * 60;
            case ELEVEN_AM -> 11 * 60;
            case ONE_PM -> 13 * 60;
            case THREE_PM -> 15 * 60;
            case FIVE_PM -> 17 * 60;
        };
    }

    @Override
    public EmployeeScheduleResponseModel patchDateSchedule(String employeeId, String date, EmployeeScheduleRequestModel scheduleRequest) {
        
        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
        }

        if (Boolean.FALSE.equals(employee.getIsActive())) {
            throw new InvalidOperationException("Cannot update schedule for deactivated employee " + employeeId + ".");
        }

        
        LocalDateTime targetDate;
        try {
            targetDate = LocalDateTime.parse(date + "T00:00:00");
        } catch (Exception e) {
            throw new InvalidOperationException("Invalid date format. Expected format: YYYY-MM-DD (e.g., 2025-12-05)");
        }

        // Extract day of week from date
        DayOfWeekType dayOfWeek = getDayOfWeekFromDate(targetDate);
        
        // Validate day of week matches
        if (!dayOfWeek.equals(scheduleRequest.getDayOfWeek())) {
            throw new InvalidOperationException("Day of week for date " + date + " (" + dayOfWeek + ") must match day in request body (" + scheduleRequest.getDayOfWeek() + ").");
        }

        List<Schedule> allSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);
        if (allSchedules == null || allSchedules.isEmpty()) {
            throw new ResourceNotFoundException("Employee " + employeeId + " does not have an existing schedule.");
        }

        // Get existing schedules for this day
        List<Schedule> daySchedules = allSchedules.stream()
            .filter(s -> s.getDayOfWeek() != null && s.getDayOfWeek().getDayOfWeek() != null)
            .filter(s -> s.getDayOfWeek().getDayOfWeek().equals(dayOfWeek))
            .collect(Collectors.toList());

        // Validate input
        if (scheduleRequest.getTimeSlots() == null || scheduleRequest.getTimeSlots().isEmpty()) {
            throw new MissingDataException("Day " + dayOfWeek + " must have at least one time slot.");
        }

        for (TimeSlotType timeSlot : scheduleRequest.getTimeSlots()) {
            if (timeSlot == null) {
                throw new MissingDataException("Time slot cannot be null for day " + dayOfWeek);
            }
        }

        boolean isTechnician = employee.getEmployeeRole() != null &&
            employee.getEmployeeRole().getEmployeeRoleType() == com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN;

        // Validate time slots for role
        if (!isTechnician) {
            if (scheduleRequest.getTimeSlots().size() != 2) {
                throw new MissingDataException("Non-technician employees must provide exactly 2 time slots per day: start and end times.");
            }
            List<TimeSlotType> sorted = scheduleRequest.getTimeSlots().stream().sorted(Comparator.comparingInt(this::toMinutes)).toList();
            if (sorted.get(0) != TimeSlotType.NINE_AM) {
                throw new MissingDataException("Non-technician employees must start at NINE_AM (9:00 AM).");
            }
            int startMinutes = toMinutes(sorted.get(0));
            int endMinutes = toMinutes(sorted.get(1));
            int dailyHours = (endMinutes - startMinutes) / 60;
            if (dailyHours > 8) {
                throw new MissingDataException("Non-technician employees cannot work more than 8 hours per day. Hours: " + dailyHours);
            }
        } else {
            List<Integer> minutes = scheduleRequest.getTimeSlots().stream()
                    .map(this::toMinutes)
                    .sorted()
                    .toList();
            for (int i = 1; i < minutes.size(); i++) {
                if (minutes.get(i) - minutes.get(i - 1) < 120) {
                    throw new MissingDataException("Technician time slots must be at least 2 hours apart.");
                }
            }
            if (scheduleRequest.getTimeSlots().size() > 4) {
                throw new MissingDataException("Technician cannot exceed 8 hours in a single day (max 4 slots of 2h each).");
            }
        }

        // Check for appointments on the specific date and removed time slots
        LocalDateTime startOfDay = targetDate.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = targetDate.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        // Get all appointments for the technician and filter by date and scheduled status
        List<Appointment> allTechAppointments = appointmentRepository.findAllByTechnician(employee);
        
        List<Appointment> affectedAppointments = allTechAppointments.stream()
            .filter(a -> a.getAppointmentStatus() != null && 
                    a.getAppointmentStatus().getAppointmentStatusType() == AppointmentStatusType.SCHEDULED)
            .filter(a -> a.getAppointmentDate().isAfter(startOfDay) && a.getAppointmentDate().isBefore(endOfDay))
            .collect(Collectors.toList());

        // Check if any appointment's time slot is being removed from the new schedule
        Set<TimeSlotType> newTimeSlots = new HashSet<>(scheduleRequest.getTimeSlots());
        for (Appointment appointment : affectedAppointments) {
            TimeSlotType appointmentSlot = getTimeSlotFromAppointment(appointment);
            if (!newTimeSlots.contains(appointmentSlot)) {
                throw new InvalidOperationException("Cannot edit schedule; there is an appointment on this date at a time slot you are removing.");
            }
        }

        // Delete existing date-specific schedules for this date
        LocalDate specificDate = targetDate.toLocalDate();
        List<Schedule> existingDateSpecificSchedules = allSchedules.stream()
            .filter(s -> s.getSpecificDate() != null && s.getSpecificDate().equals(specificDate))
            .collect(Collectors.toList());
        
        if (!existingDateSpecificSchedules.isEmpty()) {
            scheduleRepository.deleteAll(existingDateSpecificSchedules);
        }

        // Create new date-specific schedules
        List<Schedule> newSchedules = scheduleRequest.getTimeSlots().stream()
            .map(timeSlot -> {
                Schedule newSchedule = new Schedule();
                newSchedule.setEmployee(employee);
                
                DayOfWeek dayOfWeekObj = new DayOfWeek();
                dayOfWeekObj.setDayOfWeek(dayOfWeek);
                newSchedule.setDayOfWeek(dayOfWeekObj);
                
                TimeSlot timeSlotObj = new TimeSlot();
                timeSlotObj.setTimeslot(timeSlot);
                newSchedule.setTimeSlot(timeSlotObj);
                
                newSchedule.setSpecificDate(specificDate);
                return newSchedule;
            })
            .collect(Collectors.toList());
        
        scheduleRepository.saveAll(newSchedules);

        // Return response
        EmployeeScheduleResponseModel response = new EmployeeScheduleResponseModel();
        response.setEmployeeId(employeeId);
        response.setDayOfWeek(dayOfWeek);
        List<String> sortedTimeSlots = scheduleRequest.getTimeSlots().stream()
            .sorted(Comparator.comparing(TimeSlotType::ordinal))
            .map(TimeSlotType::getDisplayTime)
            .collect(Collectors.toList());
        response.setTimeSlots(sortedTimeSlots);
        return response;
    }

    private TimeSlotType getTimeSlotFromAppointment(Appointment appointment) {
        if (appointment.getSchedule() != null && appointment.getSchedule().getTimeSlot() != null) {
            return appointment.getSchedule().getTimeSlot().getTimeslot();
        }
        
        
        LocalDateTime date = appointment.getAppointmentDate();
        int hour = date.getHour();
        
        return switch (hour) {
            case 9 -> TimeSlotType.NINE_AM;
            case 11 -> TimeSlotType.ELEVEN_AM;
            case 13 -> TimeSlotType.ONE_PM;
            case 15 -> TimeSlotType.THREE_PM;
            case 17 -> TimeSlotType.FIVE_PM;
            default -> TimeSlotType.NINE_AM;
        };
    }

    private TimeSlotType findEarlierAvailableSlot(TimeSlotType currentSlot, Set<TimeSlotType> availableSlots) {
        int currentMinutes = toMinutes(currentSlot);
        
        // Look for earlier slots
        return availableSlots.stream()
            .filter(slot -> toMinutes(slot) < currentMinutes)
            .max(Comparator.comparingInt(this::toMinutes))
            .orElse(null);
    }

    private LocalDateTime adjustAppointmentTime(LocalDateTime originalDate, TimeSlotType newSlot) {
        int newHour = switch (newSlot) {
            case NINE_AM -> 9;
            case ELEVEN_AM -> 11;
            case ONE_PM -> 13;
            case THREE_PM -> 15;
            case FIVE_PM -> 17;
        };
        
        return originalDate.withHour(newHour).withMinute(0).withSecond(0).withNano(0);
    }

    private DayOfWeekType getDayOfWeekFromDate(LocalDateTime date) {
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        return switch (dayOfWeek) {
            case MONDAY -> DayOfWeekType.MONDAY;
            case TUESDAY -> DayOfWeekType.TUESDAY;
            case WEDNESDAY -> DayOfWeekType.WEDNESDAY;
            case THURSDAY -> DayOfWeekType.THURSDAY;
            case FRIDAY -> DayOfWeekType.FRIDAY;
            case SATURDAY, SUNDAY -> throw new InvalidOperationException("Cannot schedule for weekends. Only Monday-Friday are supported.");
        };
    }

    // --- Simple FR helpers for user-facing messages ---
    
}
