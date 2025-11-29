package com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeekType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeScheduleResponseMapper responseMapper; // Mapper remains for dependency injection

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, EmployeeRepository employeeRepository, EmployeeScheduleResponseMapper responseMapper) {
        this.scheduleRepository = scheduleRepository;
        this.employeeRepository = employeeRepository;
        this.responseMapper = responseMapper;
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
}
