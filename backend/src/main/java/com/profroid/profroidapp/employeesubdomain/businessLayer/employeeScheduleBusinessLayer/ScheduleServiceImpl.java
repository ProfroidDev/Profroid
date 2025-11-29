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


}
