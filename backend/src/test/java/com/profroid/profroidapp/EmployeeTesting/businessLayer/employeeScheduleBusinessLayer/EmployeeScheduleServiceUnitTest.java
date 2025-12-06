package com.profroid.profroidapp.EmployeeTesting.businessLayer.employeeScheduleBusinessLayer;

import com.profroid.profroidapp.employeesubdomain.businessLayer.employeeScheduleBusinessLayer.ScheduleServiceImpl;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.*;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleRequestMapper;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeScheduleMappers.EmployeeScheduleResponseMapper;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.MissingDataException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class EmployeeScheduleServiceUnitTest {

    private final String VALID_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000000";
    private final String INVALID_EMPLOYEE_ID = "invalid-id";
    private final String NON_EXISTING_EMPLOYEE_ID = "11111111-1111-1111-1111-111111111111";

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private EmployeeScheduleResponseMapper responseMapper;
    @Mock private EmployeeScheduleRequestMapper requestMapper;
        @Mock private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private Employee technician;
    private Employee nonTechnician;

    @BeforeEach
    void setup() {
        technician = new Employee();
        technician.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
        EmployeeRole techRole = new EmployeeRole();
        techRole.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
        technician.setEmployeeRole(techRole);

        nonTechnician = new Employee();
        nonTechnician.setEmployeeIdentifier(new EmployeeIdentifier(VALID_EMPLOYEE_ID));
        EmployeeRole supportRole = new EmployeeRole();
        supportRole.setEmployeeRoleType(EmployeeRoleType.SUPPORT);
        nonTechnician.setEmployeeRole(supportRole);

                // default: no appointments
                when(appointmentRepository.findScheduledAppointmentsByTechnicianAndSchedules(any(), anyList())).thenReturn(Collections.emptyList());
                when(appointmentRepository.findAllByTechnicianAndSchedule(any(), any())).thenReturn(Collections.emptyList());
    }

    // ===== getEmployeeSchedule =====
    // Positive: valid id and existing employee returns grouped responses
    @Test
    void whenGetSchedule_withValidId_thenReturnResponses() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        // existing schedules
        Schedule s1 = new Schedule();
        DayOfWeek d1 = new DayOfWeek(); d1.setDayOfWeek(DayOfWeekType.MONDAY); s1.setDayOfWeek(d1);
        TimeSlot ts1 = new TimeSlot(); ts1.setTimeslot(TimeSlotType.NINE_AM); s1.setTimeSlot(ts1);
        Schedule s2 = new Schedule();
        DayOfWeek d2 = new DayOfWeek(); d2.setDayOfWeek(DayOfWeekType.MONDAY); s2.setDayOfWeek(d2);
        TimeSlot ts2 = new TimeSlot(); ts2.setTimeslot(TimeSlotType.ELEVEN_AM); s2.setTimeSlot(ts2);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Arrays.asList(s1, s2));

        List<EmployeeScheduleResponseModel> result = scheduleService.getEmployeeSchedule(VALID_EMPLOYEE_ID);
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(DayOfWeekType.MONDAY, result.get(0).getDayOfWeek());
        assertEquals(2, result.get(0).getTimeSlots().size());

        verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
        verify(scheduleRepository).findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID);
    }

    // Negative: invalid id format
    @Test
    void whenGetSchedule_withInvalidId_thenThrowInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> scheduleService.getEmployeeSchedule(INVALID_EMPLOYEE_ID));
        verify(employeeRepository, never()).findEmployeeByEmployeeIdentifier_EmployeeId(anyString());
    }

    // Negative: employee not found
    @Test
    void whenGetSchedule_withNonExistingEmployee_thenThrowNotFound() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> scheduleService.getEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID));
        verify(employeeRepository).findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID);
    }

    // ===== addEmployeeSchedule =====
    // Negative: invalid id
    @Test
    void whenAddSchedule_withInvalidId_thenThrowInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> scheduleService.addEmployeeSchedule(INVALID_EMPLOYEE_ID, Collections.emptyList()));
    }

    // Negative: employee not found
    @Test
    void whenAddSchedule_withNonExistingEmployee_thenThrowNotFound() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> scheduleService.addEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID, Collections.emptyList()));
    }

    // Negative: existing schedules found -> cannot add
    @Test
    void whenAddSchedule_withExistingSchedules_thenThrowAlreadyExists() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(new Schedule()));
        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();
        assertThrows(ResourceAlreadyExistsException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: missing requests
    @Test
    void whenAddSchedule_withEmptyRequests_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());
        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, Collections.emptyList()));
    }

    // Negative: not all 5 days provided
    @Test
    void whenAddSchedule_missingDays_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());
        List<EmployeeScheduleRequestModel> reqs = Arrays.asList(
                requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM)
        );
        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Positive: technician valid requests within rules saves and returns
    @Test
    void whenAddSchedule_technicianValid_thenSaveAndReturn() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();


                when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                                .thenAnswer(invocation -> {
                                        EmployeeScheduleRequestModel req = invocation.getArgument(0);
                                        List<Schedule> schedules = new ArrayList<>();
                                        if (req.getTimeSlots() != null) {
                                                for (TimeSlotType slotType : req.getTimeSlots()) {
                                                        Schedule s = new Schedule();
                                                        DayOfWeek d = new DayOfWeek();
                                                        d.setDayOfWeek(req.getDayOfWeek());
                                                        s.setDayOfWeek(d);
                                                        TimeSlot ts = new TimeSlot();
                                                        ts.setTimeslot(slotType);
                                                        s.setTimeSlot(ts);
                                                        schedules.add(s);
                                                }
                                        }
                                        return schedules;
                                });
        when(scheduleRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());

        // Stub final response via getEmployeeSchedule flow
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleResponseModel> result = scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs);
        assertNotNull(result);
        verify(scheduleRepository).saveAll(any(List.class));
    }

    // Negative: non-technician must have exactly 2 time slots and start at 9AM, <=8h per day, <=40h week
    @Test
    void whenAddSchedule_nonTechnicianViolatesRules_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(nonTechnician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        // Provide five days but with 3 time slots on Monday
        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM, TimeSlotType.ONE_PM));
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: add - request contains a null timeslot entry
    @Test
    void whenAddSchedule_withNullTimeSlot_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();
        // Inject a null slot on Monday
        reqs.set(0, requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, null));

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: add - technician slots closer than 2 hours
    @Test
    void whenAddSchedule_technicianTooCloseSlots_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        // Tuesday: duplicate ELEVEN_AM to create 0-minute gap (<120)
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.ELEVEN_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: add - technician day has more than 4 slots
    @Test
    void whenAddSchedule_technicianTooManySlots_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: add - weekly hours exceed 40 for non-technician
    @Test
    void whenAddSchedule_nonTechnicianWeeklyOver40_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(nonTechnician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        // 5 days of 9am-5pm -> 8h/day = 40h, bump Friday to 5pm -> 1pm to make under/over mix (but non-tech needs 2 slots; use 9-5 for four days and 9-5 + invalid third slot to trigger earlier rule)
        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        // Make Friday 9am-5pm plus 1pm to fail exact-2 rule first
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM, TimeSlotType.ONE_PM));

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: add - mapper produces entity with null dayOfWeek or timeSlot
    @Test
    void whenAddSchedule_entityMappingNulls_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();

        when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                .thenAnswer(inv -> {
                    // Return one schedule with null dayOfWeek to hit entity validation
                    Schedule s = new Schedule();
                    s.setDayOfWeek(null);
                    TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); s.setTimeSlot(ts);
                    return Collections.singletonList(s);
                });

        assertThrows(MissingDataException.class,
                () -> scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Positive: add - non-technician valid 5 days (9-5) executes weekly hours path and saves
    @Test
    void whenAddSchedule_nonTechnicianValid_thenSaveAndReturn() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(nonTechnician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));

        // Mapper returns valid entities
        when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                .thenAnswer(invocation -> {
                    EmployeeScheduleRequestModel req = invocation.getArgument(0);
                    List<Schedule> schedules = new ArrayList<>();
                    for (TimeSlotType slotType : req.getTimeSlots()) {
                        Schedule s = new Schedule();
                        DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(req.getDayOfWeek()); s.setDayOfWeek(d);
                        TimeSlot ts = new TimeSlot(); ts.setTimeslot(slotType); s.setTimeSlot(ts);
                        schedules.add(s);
                    }
                    return schedules;
                });
        when(scheduleRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());
        // getEmployeeSchedule read
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());

        List<EmployeeScheduleResponseModel> result = scheduleService.addEmployeeSchedule(VALID_EMPLOYEE_ID, reqs);
        assertNotNull(result);
        verify(scheduleRepository).saveAll(any(List.class));
    }

    // ===== updateEmployeeSchedule =====
    // Negative: invalid id
    @Test
    void whenUpdateSchedule_withInvalidId_thenThrowInvalidIdentifier() {
        assertThrows(InvalidIdentifierException.class,
                () -> scheduleService.updateEmployeeSchedule(INVALID_EMPLOYEE_ID, Collections.emptyList()));
    }

    // Negative: employee not found
    @Test
    void whenUpdateSchedule_withNonExistingEmployee_thenThrowNotFound() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(NON_EXISTING_EMPLOYEE_ID))
                .thenReturn(null);
        assertThrows(ResourceNotFoundException.class,
                () -> scheduleService.updateEmployeeSchedule(NON_EXISTING_EMPLOYEE_ID, Collections.emptyList()));
    }

    // Negative: no existing schedules to update
    @Test
    void whenUpdateSchedule_withoutExisting_thenThrowNotFound() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.emptyList());
        assertThrows(ResourceNotFoundException.class,
                () -> scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, minimalFiveDaysTechRequests()));
    }

    // Positive: valid update deletes and saves
    @Test
    void whenUpdateSchedule_valid_thenDeleteAndSave() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        // First call (pre-check) returns existing schedules; second call (post-update read) returns empty
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(new Schedule()), Collections.emptyList());

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();
                when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                                .thenAnswer(invocation -> {
                                        EmployeeScheduleRequestModel req = invocation.getArgument(0);
                                        List<Schedule> schedules = new ArrayList<>();
                                        if (req.getTimeSlots() != null) {
                                                for (TimeSlotType slotType : req.getTimeSlots()) {
                                                        Schedule s = new Schedule();
                                                        DayOfWeek d = new DayOfWeek();
                                                        d.setDayOfWeek(req.getDayOfWeek());
                                                        s.setDayOfWeek(d);
                                                        TimeSlot ts = new TimeSlot();
                                                        ts.setTimeslot(slotType);
                                                        s.setTimeSlot(ts);
                                                        schedules.add(s);
                                                }
                                        }
                                        return schedules;
                                });

        // saveAll
        when(scheduleRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());

        List<EmployeeScheduleResponseModel> result = scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs);
        assertNotNull(result);
        verify(scheduleRepository).deleteAll(any(List.class));
        verify(scheduleRepository).saveAll(any(List.class));
    }

    // Negative: update - mapper produces entity with null timeSlot
    @Test
    void whenUpdateSchedule_entityMappingNulls_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(new Schedule()));

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();

        when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                .thenAnswer(inv -> {
                    Schedule s = new Schedule();
                    DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); s.setDayOfWeek(d);
                    s.setTimeSlot(null);
                    return Collections.singletonList(s);
                });

        assertThrows(MissingDataException.class,
                () -> scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    // Negative: update - non-technician day exceeds 8 hours
    @Test
    void whenUpdateSchedule_nonTechnicianDailyOver8_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(nonTechnician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(new Schedule()));

        List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
        // 9am to 5pm is 8h, exceed by using 9am to 5pm and pretend sorted still 9 & 5; instead use 9 & FIVE_PM and change another day to 9 & FIVE_PM to still 5 days
        reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        // Friday: invalid three slots to trigger rule path; but we need 2-slot path overflow: use NINE_AM and THREE_PM (6h) won't exceed; use NINE_AM and FIVE_PM is 8h already. To exceed daily 8h is impossible with given slots; instead trigger start not 9AM rule.
        reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.ELEVEN_AM, TimeSlotType.FIVE_PM));

        assertThrows(MissingDataException.class,
                () -> scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    @Test
    void whenUpdateSchedule_withExistingAppointmentRemovingSlot_thenThrowInvalidOperation() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);

        Schedule existing = new Schedule();
        DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); existing.setDayOfWeek(d);
        TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); existing.setTimeSlot(ts);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(existing));

        Appointment appt = new Appointment();
        appt.setAppointmentDate(LocalDateTime.parse("2025-12-08T09:00:00"));
        Schedule apptSchedule = new Schedule();
        DayOfWeek ad = new DayOfWeek(); ad.setDayOfWeek(DayOfWeekType.MONDAY); apptSchedule.setDayOfWeek(ad);
        TimeSlot ats = new TimeSlot(); ats.setTimeslot(TimeSlotType.NINE_AM); apptSchedule.setTimeSlot(ats);
        appt.setSchedule(apptSchedule);

        when(appointmentRepository.findScheduledAppointmentsByTechnicianAndSchedules(eq(technician), anyList()))
                .thenReturn(Collections.singletonList(appt));

        List<EmployeeScheduleRequestModel> reqs = minimalFiveDaysTechRequests();
        // remove Monday 9AM to trigger conflict
        reqs.set(0, requestForDay(DayOfWeekType.MONDAY, TimeSlotType.ELEVEN_AM));

        assertThrows(InvalidOperationException.class,
                () -> scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

    @Test
    void whenUpdateSchedule_missingDays_thenThrowMissingData() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(technician);
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                .thenReturn(Collections.singletonList(new Schedule()));

        List<EmployeeScheduleRequestModel> reqs = Arrays.asList(
                requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM)
        );

        assertThrows(MissingDataException.class,
                () -> scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs));
    }

        // Positive: update - non-technician valid 5 days (9-5) executes weekly hours path and saves
        @Test
        void whenUpdateSchedule_nonTechnicianValid_thenDeleteAndSave() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                                .thenReturn(nonTechnician);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                                .thenReturn(Collections.singletonList(new Schedule()), Collections.emptyList());

                List<EmployeeScheduleRequestModel> reqs = new ArrayList<>();
                reqs.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
                reqs.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
                reqs.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
                reqs.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
                reqs.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));

                when(requestMapper.toEntityList(any(EmployeeScheduleRequestModel.class)))
                                .thenAnswer(invocation -> {
                                        EmployeeScheduleRequestModel req = invocation.getArgument(0);
                                        List<Schedule> schedules = new ArrayList<>();
                                        for (TimeSlotType slotType : req.getTimeSlots()) {
                                                Schedule s = new Schedule();
                                                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(req.getDayOfWeek()); s.setDayOfWeek(d);
                                                TimeSlot ts = new TimeSlot(); ts.setTimeslot(slotType); s.setTimeSlot(ts);
                                                schedules.add(s);
                                        }
                                        return schedules;
                                });

                when(scheduleRepository.saveAll(any(List.class))).thenReturn(Collections.emptyList());

                List<EmployeeScheduleResponseModel> result = scheduleService.updateEmployeeSchedule(VALID_EMPLOYEE_ID, reqs);
                assertNotNull(result);
                verify(scheduleRepository).deleteAll(any(List.class));
                verify(scheduleRepository).saveAll(any(List.class));
        }

    // Helpers to build request models
    private EmployeeScheduleRequestModel requestForDay(DayOfWeekType day, TimeSlotType... slots) {
        return EmployeeScheduleRequestModel.builder()
                .dayOfWeek(day)
                .timeSlots(Arrays.asList(slots))
                .build();
    }

    private List<EmployeeScheduleRequestModel> minimalFiveDaysTechRequests() {
        List<EmployeeScheduleRequestModel> list = new ArrayList<>();
        list.add(requestForDay(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        list.add(requestForDay(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        list.add(requestForDay(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        list.add(requestForDay(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        list.add(requestForDay(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        return list;
    }

        // ===== date-specific GET =====
        @Test
        void whenGetScheduleForDate_withOverride_thenReturnDateSpecific() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                Schedule override = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.TUESDAY); override.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); override.setTimeSlot(ts);
                override.setSpecificDate(LocalDate.parse("2025-12-09"));

                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(VALID_EMPLOYEE_ID, LocalDate.parse("2025-12-09")))
                        .thenReturn(Collections.singletonList(override));

                List<EmployeeScheduleResponseModel> res = scheduleService.getEmployeeScheduleForDate(VALID_EMPLOYEE_ID, "2025-12-09");
                assertEquals(1, res.size());
                assertEquals(DayOfWeekType.TUESDAY, res.get(0).getDayOfWeek());
                assertEquals(1, res.get(0).getTimeSlots().size());
                assertEquals("9:00 AM", res.get(0).getTimeSlots().get(0));
        }

        @Test
        void whenGetScheduleForDate_withoutOverride_thenFallbackWeekly() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(eq(VALID_EMPLOYEE_ID), any(LocalDate.class)))
                        .thenReturn(Collections.emptyList());

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.ELEVEN_AM); weekly.setTimeSlot(ts);
                weekly.setSpecificDate(null);

                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                List<EmployeeScheduleResponseModel> res = scheduleService.getEmployeeScheduleForDate(VALID_EMPLOYEE_ID, "2025-12-08");
                assertEquals(1, res.size());
                assertEquals(DayOfWeekType.MONDAY, res.get(0).getDayOfWeek());
                assertEquals("11:00 AM", res.get(0).getTimeSlots().get(0));
        }

        @Test
        void whenGetScheduleForDate_withInvalidDate_thenThrowInvalidOperation() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                assertThrows(InvalidOperationException.class,
                        () -> scheduleService.getEmployeeScheduleForDate(VALID_EMPLOYEE_ID, "2025/12/08"));
        }

        @Test
        void whenGetScheduleForDate_withoutWeeklyOrOverride_thenReturnEmpty() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(eq(VALID_EMPLOYEE_ID), any(LocalDate.class)))
                        .thenReturn(Collections.emptyList());
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.emptyList());

                List<EmployeeScheduleResponseModel> res = scheduleService.getEmployeeScheduleForDate(VALID_EMPLOYEE_ID, "2025-12-08");
                assertTrue(res.isEmpty());
        }



        @Test
        void whenPatchDateSchedule_valid_thenPersistDateSpecific() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); weekly.setTimeSlot(ts);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                when(appointmentRepository.findAllByTechnician(eq(technician)))
                        .thenReturn(Collections.emptyList());

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.THREE_PM))
                        .build();

                scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req);

                verify(scheduleRepository).saveAll(any(List.class));
        }

        @Test
        void whenPatchDateSchedule_nonTechnicianNotTwoSlots_thenThrowMissingData() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(nonTechnician);

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); weekly.setTimeSlot(ts);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM))
                        .build();

                assertThrows(MissingDataException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req));
        }

        @Test
        void whenPatchDateSchedule_nonTechnicianNotStartingAtNine_thenThrowMissingData() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(nonTechnician);

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); weekly.setTimeSlot(ts);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.ELEVEN_AM, TimeSlotType.FIVE_PM))
                        .build();

                assertThrows(MissingDataException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req));
        }

        @Test
        void whenPatchDateSchedule_technicianSlotsTooClose_thenThrowMissingData() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); weekly.setTimeSlot(ts);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.NINE_AM))
                        .build();

                assertThrows(MissingDataException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req));
        }

        @Test
        void whenPatchDateSchedule_technicianTooManySlots_thenThrowMissingData() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                Schedule weekly = new Schedule();
                DayOfWeek d = new DayOfWeek(); d.setDayOfWeek(DayOfWeekType.MONDAY); weekly.setDayOfWeek(d);
                TimeSlot ts = new TimeSlot(); ts.setTimeslot(TimeSlotType.NINE_AM); weekly.setTimeSlot(ts);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(weekly));

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM, TimeSlotType.FIVE_PM))
                        .build();

                assertThrows(MissingDataException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req));
        }

        @Test
        void whenPatchDateSchedule_withDateMismatch_thenThrowInvalidOperation() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);
                when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(Collections.singletonList(new Schedule()));

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.TUESDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM))
                        .build();

                assertThrows(InvalidOperationException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "2025-12-08", req));
        }

        @Test
        void whenPatchDateSchedule_withBadDateFormat_thenThrowInvalidOperation() {
                when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(VALID_EMPLOYEE_ID))
                        .thenReturn(technician);

                EmployeeScheduleRequestModel req = EmployeeScheduleRequestModel.builder()
                        .dayOfWeek(DayOfWeekType.MONDAY)
                        .timeSlots(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM))
                        .build();

                assertThrows(InvalidOperationException.class,
                        () -> scheduleService.patchDateSchedule(VALID_EMPLOYEE_ID, "12-08-2025", req));
        }

        // ===== helper coverage =====
        @Test
        void whenGetTimeSlotFromAppointment_withoutSchedule_usesHourMapping() throws Exception {
                Appointment appointment = new Appointment();
                appointment.setAppointmentDate(LocalDateTime.parse("2025-12-08T13:00:00"));

                Method method = ScheduleServiceImpl.class.getDeclaredMethod("getTimeSlotFromAppointment", Appointment.class);
                method.setAccessible(true);

                TimeSlotType slot = (TimeSlotType) method.invoke(scheduleService, appointment);
                assertEquals(TimeSlotType.ONE_PM, slot);
        }

        @Test
        void whenFindEarlierAvailableSlot_withEarlierOptions_returnsClosestEarlier() throws Exception {
                Method method = ScheduleServiceImpl.class.getDeclaredMethod("findEarlierAvailableSlot", TimeSlotType.class, Set.class);
                method.setAccessible(true);

                Set<TimeSlotType> available = new HashSet<>(Arrays.asList(TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM, TimeSlotType.THREE_PM));

                TimeSlotType result = (TimeSlotType) method.invoke(scheduleService, TimeSlotType.THREE_PM, available);
                assertEquals(TimeSlotType.ELEVEN_AM, result);
        }

        @Test
        void whenFindEarlierAvailableSlot_withoutEarlierOption_returnsNull() throws Exception {
                Method method = ScheduleServiceImpl.class.getDeclaredMethod("findEarlierAvailableSlot", TimeSlotType.class, Set.class);
                method.setAccessible(true);

                Set<TimeSlotType> available = new HashSet<>(Collections.singletonList(TimeSlotType.FIVE_PM));

                TimeSlotType result = (TimeSlotType) method.invoke(scheduleService, TimeSlotType.FIVE_PM, available);
                assertNull(result);
        }

        @Test
        void whenAdjustAppointmentTime_setsNewHour() throws Exception {
                Method method = ScheduleServiceImpl.class.getDeclaredMethod("adjustAppointmentTime", LocalDateTime.class, TimeSlotType.class);
                method.setAccessible(true);

                LocalDateTime original = LocalDateTime.parse("2025-12-08T09:30:00");
                LocalDateTime adjusted = (LocalDateTime) method.invoke(scheduleService, original, TimeSlotType.THREE_PM);

                assertEquals(15, adjusted.getHour());
                assertEquals(0, adjusted.getMinute());
        }

        @Test
        void whenGetDayOfWeekFromDate_weekend_thenThrowInvalidOperation() throws Exception {
                Method method = ScheduleServiceImpl.class.getDeclaredMethod("getDayOfWeekFromDate", LocalDateTime.class);
                method.setAccessible(true);

                InvocationTargetException ex = assertThrows(InvocationTargetException.class,
                        () -> method.invoke(scheduleService, LocalDateTime.parse("2025-12-06T09:00:00")));
                assertTrue(ex.getCause() instanceof InvalidOperationException);
        }
}
