package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.MissingDataException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleResponseMapper responseMapper;
    private final EmployeeScheduleRequestMapper requestMapper;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, EmployeeRepository employeeRepository, EmployeeScheduleResponseMapper responseMapper, EmployeeScheduleRequestMapper requestMapper) {
        this.scheduleRepository = scheduleRepository;
        this.employeeRepository = employeeRepository;
        this.responseMapper = responseMapper;
        this.requestMapper = requestMapper;
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

        Map<DayOfWeekType, List<Schedule>> schedulesByDay = schedules.stream()
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
    public List<EmployeeScheduleResponseModel> addEmployeeSchedule(String employeeId, List<EmployeeScheduleRequestModel> scheduleRequests) {

        if (employeeId == null || employeeId.trim().length() != 36) {
            throw new InvalidIdentifierException("Employee ID must be a 36-character UUID string.");
        }

        Employee employee = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee " + employeeId + " not found.");
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

        List<Schedule> existingSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(employeeId);
        if (existingSchedules == null || existingSchedules.isEmpty()) {
            throw new ResourceNotFoundException("Employee " + employeeId + " does not have an existing schedule to update.");
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

        // Delete existing schedules
        scheduleRepository.deleteAll(existingSchedules);

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

    private int toMinutes(TimeSlotType slot) {
        return switch (slot) {
            case NINE_AM -> 9 * 60;
            case ELEVEN_AM -> 11 * 60;
            case ONE_PM -> 13 * 60;
            case THREE_PM -> 15 * 60;
            case FIVE_PM -> 17 * 60;
        };
    }


}
