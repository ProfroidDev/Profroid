package com.profroid.profroidapp.EmployeeTesting.presentationLayer.employeeSchedulePresentationLayer;

import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeeSchedulePresentationLayer.EmployeeScheduleResponseModel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = RANDOM_PORT)
public class EmployeeScheduleControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    private Employee technicianEmployee;
    private String technicianEmployeeId;

    private Employee supportEmployee;
    private String supportEmployeeId;

    @BeforeEach
    void setup() {
        // Clean up before each test
        scheduleRepository.deleteAll();
        employeeRepository.deleteAll();

        // Create technician employee
        technicianEmployee = new Employee();
        technicianEmployee.setEmployeeIdentifier(new EmployeeIdentifier());
        technicianEmployee.setFirstName("Tech");
        technicianEmployee.setLastName("Nician");
        technicianEmployee.setUserId("technician");

        EmployeePhoneNumber techPhone = new EmployeePhoneNumber();
        techPhone.setType(EmployeePhoneType.MOBILE);
        techPhone.setNumber("514-111-1111");
        technicianEmployee.setPhoneNumbers(Collections.singletonList(techPhone));

        EmployeeAddress techAddress = EmployeeAddress.builder()
                .streetAddress("100 Tech St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1T 1T1")
                .build();
        technicianEmployee.setEmployeeAddress(techAddress);

        EmployeeRole techRole = new EmployeeRole();
        techRole.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
        technicianEmployee.setEmployeeRole(techRole);

        Employee savedTech = employeeRepository.save(technicianEmployee);
        technicianEmployeeId = savedTech.getEmployeeIdentifier().getEmployeeId();

        // Create support employee
        supportEmployee = new Employee();
        supportEmployee.setEmployeeIdentifier(new EmployeeIdentifier());
        supportEmployee.setFirstName("Support");
        supportEmployee.setLastName("Staff");
        supportEmployee.setUserId("support");

        EmployeePhoneNumber supportPhone = new EmployeePhoneNumber();
        supportPhone.setType(EmployeePhoneType.MOBILE);
        supportPhone.setNumber("514-222-2222");
        supportEmployee.setPhoneNumbers(Collections.singletonList(supportPhone));

        EmployeeAddress supportAddress = EmployeeAddress.builder()
                .streetAddress("200 Support St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H2S 2S2")
                .build();
        supportEmployee.setEmployeeAddress(supportAddress);

        EmployeeRole supportRole = new EmployeeRole();
        supportRole.setEmployeeRoleType(EmployeeRoleType.SUPPORT);
        supportEmployee.setEmployeeRole(supportRole);

        Employee savedSupport = employeeRepository.save(supportEmployee);
        supportEmployeeId = savedSupport.getEmployeeIdentifier().getEmployeeId();
    }

    @AfterEach
    void cleanup() {
        scheduleRepository.deleteAll();
        employeeRepository.deleteAll();
    }

    // ===== GET EMPLOYEE SCHEDULE =====

    // [EmployeeSchedule-Controller][Integration Test][Positive] Get schedule with existing schedules -> returns grouped schedule
    @Test
    void whenGetSchedule_withExistingSchedules_thenReturnsSchedule() {
        // Add some schedules for technician
        Schedule s1 = new Schedule();
        DayOfWeek d1 = new DayOfWeek();
        d1.setDayOfWeek(DayOfWeekType.MONDAY);
        s1.setDayOfWeek(d1);
        TimeSlot ts1 = new TimeSlot();
        ts1.setTimeslot(TimeSlotType.NINE_AM);
        s1.setTimeSlot(ts1);
        s1.setEmployee(technicianEmployee);

        Schedule s2 = new Schedule();
        DayOfWeek d2 = new DayOfWeek();
        d2.setDayOfWeek(DayOfWeekType.MONDAY);
        s2.setDayOfWeek(d2);
        TimeSlot ts2 = new TimeSlot();
        ts2.setTimeslot(TimeSlotType.ELEVEN_AM);
        s2.setTimeSlot(ts2);
        s2.setEmployee(technicianEmployee);

        scheduleRepository.saveAll(Arrays.asList(s1, s2));

        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeScheduleResponseModel.class)
                .value(schedules -> {
                    assertNotNull(schedules);
                    assertFalse(schedules.isEmpty());
                    assertEquals(technicianEmployeeId, schedules.get(0).getEmployeeId());
                    assertEquals(DayOfWeekType.MONDAY, schedules.get(0).getDayOfWeek());
                    assertEquals(2, schedules.get(0).getTimeSlots().size());
                });
    }

    // [EmployeeSchedule-Controller][Integration Test][Positive] Get schedule with no schedules -> returns empty list
    @Test
    void whenGetSchedule_withNoSchedules_thenReturnsEmptyList() {
        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeScheduleResponseModel.class)
                .value(schedules -> {
                    assertNotNull(schedules);
                    assertTrue(schedules.isEmpty());
                });
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Get schedule with invalid ID -> returns 422
    @Test
    void whenGetSchedule_withInvalidId_thenReturns422() {
        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}/schedules", "invalid-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Get schedule with non-existing employee -> returns 404
    @Test
    void whenGetSchedule_withNonExistingEmployee_thenReturns404() {
        String nonExistingId = "00000000-0000-0000-0000-000000000000";

        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}/schedules", nonExistingId)
                .exchange()
                .expectStatus().isNotFound();
    }

    // ===== ADD EMPLOYEE SCHEDULE =====

    // [EmployeeSchedule-Controller][Integration Test][Positive] Add schedule for technician with valid data -> returns 201
    @Test
    void whenAddSchedule_technicianValidData_thenReturnsCreated() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeScheduleResponseModel.class)
                .value(schedules -> {
                    assertNotNull(schedules);
                    assertEquals(5, schedules.size());
                });

        // Verify in database
        List<Schedule> savedSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(technicianEmployeeId);
        assertEquals(10, savedSchedules.size()); // 5 days * 2 slots
    }

    // [EmployeeSchedule-Controller][Integration Test][Positive] Add schedule for non-technician with valid 9-5 data -> returns 201
    @Test
    void whenAddSchedule_nonTechnicianValidData_thenReturnsCreated() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        requests.add(buildRequest(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        requests.add(buildRequest(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        requests.add(buildRequest(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));
        requests.add(buildRequest(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.FIVE_PM));

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", supportEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeScheduleResponseModel.class)
                .value(schedules -> {
                    assertNotNull(schedules);
                    assertEquals(5, schedules.size());
                });

        // Verify in database
        List<Schedule> savedSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(supportEmployeeId);
        assertEquals(10, savedSchedules.size()); // 5 days * 2 slots (start & end)
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Add schedule with invalid employee ID -> returns 422
    @Test
    void whenAddSchedule_withInvalidId_thenReturns422() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", "invalid-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Add schedule with non-existing employee -> returns 404
    @Test
    void whenAddSchedule_withNonExistingEmployee_thenReturns404() {
        String nonExistingId = "00000000-0000-0000-0000-000000000000";
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", nonExistingId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isNotFound();
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Add schedule when schedule already exists -> returns 409
    @Test
    void whenAddSchedule_withExistingSchedule_thenReturns409() {
        // First add a schedule
        Schedule s1 = new Schedule();
        DayOfWeek d1 = new DayOfWeek();
        d1.setDayOfWeek(DayOfWeekType.MONDAY);
        s1.setDayOfWeek(d1);
        TimeSlot ts1 = new TimeSlot();
        ts1.setTimeslot(TimeSlotType.NINE_AM);
        s1.setTimeSlot(ts1);
        s1.setEmployee(technicianEmployee);
        scheduleRepository.save(s1);

        // Try to add again
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isEqualTo(409);
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Add schedule missing days -> returns 400
    @Test
    void whenAddSchedule_withMissingDays_thenReturns400() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        // Only 1 day provided, missing 4

        webTestClient.post()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isBadRequest();
    }

    // ===== UPDATE EMPLOYEE SCHEDULE =====

    // [EmployeeSchedule-Controller][Integration Test][Positive] Update schedule with valid data -> returns 200
    @Test
    void whenUpdateSchedule_withValidData_thenReturnsOk() {
        // First add a schedule
        Schedule s1 = new Schedule();
        DayOfWeek d1 = new DayOfWeek();
        d1.setDayOfWeek(DayOfWeekType.MONDAY);
        s1.setDayOfWeek(d1);
        TimeSlot ts1 = new TimeSlot();
        ts1.setTimeslot(TimeSlotType.NINE_AM);
        s1.setTimeSlot(ts1);
        s1.setEmployee(technicianEmployee);
        scheduleRepository.save(s1);

        // Update with new schedule
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM));
        requests.add(buildRequest(DayOfWeekType.TUESDAY, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM));
        requests.add(buildRequest(DayOfWeekType.WEDNESDAY, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM));
        requests.add(buildRequest(DayOfWeekType.THURSDAY, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM));
        requests.add(buildRequest(DayOfWeekType.FRIDAY, TimeSlotType.ONE_PM, TimeSlotType.THREE_PM));

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeScheduleResponseModel.class)
                .value(schedules -> {
                    assertNotNull(schedules);
                    assertEquals(5, schedules.size());
                });

        // Verify in database - old schedule deleted, new one saved
        List<Schedule> updatedSchedules = scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(technicianEmployeeId);
        assertEquals(10, updatedSchedules.size());
        assertTrue(updatedSchedules.stream().anyMatch(s -> s.getTimeSlot().getTimeslot() == TimeSlotType.ONE_PM));
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Update schedule with invalid ID -> returns 422
    @Test
    void whenUpdateSchedule_withInvalidId_thenReturns422() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}/schedules", "invalid-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Update schedule with non-existing employee -> returns 404
    @Test
    void whenUpdateSchedule_withNonExistingEmployee_thenReturns404() {
        String nonExistingId = "00000000-0000-0000-0000-000000000000";
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}/schedules", nonExistingId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isNotFound();
    }

    // [EmployeeSchedule-Controller][Integration Test][Negative] Update schedule when no existing schedule -> returns 404
    @Test
    void whenUpdateSchedule_withoutExistingSchedule_thenReturns404() {
        List<EmployeeScheduleRequestModel> requests = new ArrayList<>();
        requests.add(buildRequest(DayOfWeekType.MONDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.TUESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.WEDNESDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.THURSDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));
        requests.add(buildRequest(DayOfWeekType.FRIDAY, TimeSlotType.NINE_AM, TimeSlotType.ELEVEN_AM));

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}/schedules", technicianEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requests)
                .exchange()
                .expectStatus().isNotFound();
    }

    // Helper method to build request model
    private EmployeeScheduleRequestModel buildRequest(DayOfWeekType day, TimeSlotType... slots) {
        return EmployeeScheduleRequestModel.builder()
                .dayOfWeek(day)
                .timeSlots(Arrays.asList(slots))
                .build();
    }
}
