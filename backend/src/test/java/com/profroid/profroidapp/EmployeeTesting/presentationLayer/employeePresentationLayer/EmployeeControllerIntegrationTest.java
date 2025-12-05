package com.profroid.profroidapp.EmployeeTesting.presentationLayer.employeePresentationLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeRequestModel;
import com.profroid.profroidapp.employeesubdomain.presentationLayer.employeePresentationLayer.EmployeeResponseModel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
public class EmployeeControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Employee testEmployee;
    private String testEmployeeId;

    @BeforeEach
    void setup() {
        // Clean up before each test
        employeeRepository.deleteAll();

        // Create test employee
        testEmployee = new Employee();
        testEmployee.setEmployeeIdentifier(new EmployeeIdentifier());
        testEmployee.setFirstName("John");
        testEmployee.setLastName("Doe");
        testEmployee.setUserId("johndoe");

        EmployeePhoneNumber phoneNumber = new EmployeePhoneNumber();
        phoneNumber.setType(EmployeePhoneType.MOBILE);
        phoneNumber.setNumber("514-123-4567");
        testEmployee.setPhoneNumbers(Collections.singletonList(phoneNumber));

        EmployeeAddress address = EmployeeAddress.builder()
                .streetAddress("123 Main St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1A 1A1")
                .build();
        testEmployee.setEmployeeAddress(address);

        EmployeeRole role = new EmployeeRole();
        role.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
        testEmployee.setEmployeeRole(role);

        Employee saved = employeeRepository.save(testEmployee);
        testEmployeeId = saved.getEmployeeIdentifier().getEmployeeId();
    }

    @AfterEach
    void cleanup() {
        employeeRepository.deleteAll();
    }

    // ===== GET ALL EMPLOYEES =====

    // [Employee-Controller][Integration Test][Positive] Get all employees -> returns list
    @Test
    void whenGetAllEmployees_thenReturnsList() {
        webTestClient.get()
                .uri("/api/v1/employees")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeResponseModel.class)
                .value(employees -> {
                    assertNotNull(employees);
                    assertEquals(1, employees.size());
                    assertEquals("John", employees.get(0).getFirstName());
                    assertEquals("Doe", employees.get(0).getLastName());
                });
    }

    // [Employee-Controller][Integration Test][Positive] Get all employees when empty -> returns empty list
    @Test
    void whenGetAllEmployees_withNoData_thenReturnsEmptyList() {
        employeeRepository.deleteAll();

        webTestClient.get()
                .uri("/api/v1/employees")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(EmployeeResponseModel.class)
                .value(employees -> {
                    assertNotNull(employees);
                    assertTrue(employees.isEmpty());
                });
    }

    // ===== GET EMPLOYEE BY ID =====

    // [Employee-Controller][Integration Test][Positive] Get employee by ID (valid) -> returns employee
    @Test
    void whenGetEmployeeById_withValidId_thenReturnsEmployee() {
        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}", testEmployeeId)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody(EmployeeResponseModel.class)
                .value(employee -> {
                    assertNotNull(employee);
                    assertEquals(testEmployeeId, employee.getEmployeeIdentifier().getEmployeeId());
                    assertEquals("John", employee.getFirstName());
                    assertEquals("Doe", employee.getLastName());
                    assertEquals("johndoe", employee.getUserId());
                });
    }

    // [Employee-Controller][Integration Test][Negative] Get employee by ID (invalid format) -> returns 422
    @Test
    void whenGetEmployeeById_withInvalidId_thenReturns422() {
        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}", "invalid-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    // [Employee-Controller][Integration Test][Negative] Get employee by ID (not found) -> returns 404
    @Test
    void whenGetEmployeeById_withNonExistingId_thenReturns404() {
        String nonExistingId = "00000000-0000-0000-0000-000000000000";

        webTestClient.get()
                .uri("/api/v1/employees/{employeeId}", nonExistingId)
                .exchange()
                .expectStatus().isNotFound();
    }

    // ===== ADD EMPLOYEE =====

    // [Employee-Controller][Integration Test][Positive] Add employee with valid data -> returns 201
    @Test
    void whenAddEmployee_withValidData_thenReturnsCreated() {
        EmployeePhoneNumber phone = new EmployeePhoneNumber();
        phone.setType(EmployeePhoneType.MOBILE);
        phone.setNumber("514-987-6543");

        EmployeeAddress address = EmployeeAddress.builder()
                .streetAddress("456 Oak St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H2B 2B2")
                .build();

        EmployeeRole role = new EmployeeRole();
        role.setEmployeeRoleType(EmployeeRoleType.SUPPORT);

        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("Jane")
                .lastName("Smith")
                .userId("janesmith")
                .phoneNumbers(Collections.singletonList(phone))
                .employeeAddress(address)
                .employeeRole(role)
                .build();

        webTestClient.post()
                .uri("/api/v1/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody(EmployeeResponseModel.class)
                .value(employee -> {
                    assertNotNull(employee);
                    assertNotNull(employee.getEmployeeIdentifier());
                    assertEquals("Jane", employee.getFirstName());
                    assertEquals("Smith", employee.getLastName());
                    assertEquals("janesmith", employee.getUserId());
                    assertEquals(EmployeeRoleType.SUPPORT, employee.getEmployeeRole().getEmployeeRoleType());
                });

        // Verify in database
        assertEquals(2, employeeRepository.findAll().size());
    }

    // [Employee-Controller][Integration Test][Negative] Add employee with duplicate userId -> returns 409
    @Test
    void whenAddEmployee_withDuplicateUserId_thenReturns409() {
        EmployeePhoneNumber phone = new EmployeePhoneNumber();
        phone.setType(EmployeePhoneType.MOBILE);
        phone.setNumber("514-987-6543");

        EmployeeAddress address = EmployeeAddress.builder()
                .streetAddress("456 Oak St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H2B 2B2")
                .build();

        EmployeeRole role = new EmployeeRole();
        role.setEmployeeRoleType(EmployeeRoleType.ADMIN);

        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("Jane")
                .lastName("Smith")
                .userId("johndoe") // duplicate userId
                .phoneNumbers(Collections.singletonList(phone))
                .employeeAddress(address)
                .employeeRole(role)
                .build();

        webTestClient.post()
                .uri("/api/v1/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(409);

        // Verify database unchanged
        assertEquals(1, employeeRepository.findAll().size());
    }

    // ===== UPDATE EMPLOYEE =====

    // [Employee-Controller][Integration Test][Positive] Update employee with valid data -> returns 200
    @Test
    void whenUpdateEmployee_withValidData_thenReturnsUpdated() {
        EmployeePhoneNumber phone = new EmployeePhoneNumber();
        phone.setType(EmployeePhoneType.WORK);
        phone.setNumber("514-555-1234");

        EmployeeAddress address = EmployeeAddress.builder()
                .streetAddress("789 Pine St")
                .city("Laval")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3C 3C3")
                .build();

        EmployeeRole role = new EmployeeRole();
        role.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);

        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("Johnny")
                .lastName("Doe")
                .userId("johndoeupdated")
                .phoneNumbers(Collections.singletonList(phone))
                .employeeAddress(address)
                .employeeRole(role)
                .build();

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}", testEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody(EmployeeResponseModel.class)
                .value(employee -> {
                    assertNotNull(employee);
                    assertEquals(testEmployeeId, employee.getEmployeeIdentifier().getEmployeeId());
                    assertEquals("Johnny", employee.getFirstName());
                    assertEquals("johndoeupdated", employee.getUserId());
                });

        // Verify in database
        Employee updated = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(testEmployeeId);
        assertEquals("Johnny", updated.getFirstName());
        assertEquals("johndoeupdated", updated.getUserId());
    }

    // [Employee-Controller][Integration Test][Negative] Update employee with invalid ID -> returns 422
    @Test
    void whenUpdateEmployee_withInvalidId_thenReturns400() {
        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("Jane")
                .lastName("Smith")
                .userId("janesmith")
                .employeeRole(testEmployee.getEmployeeRole())
                .build();

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}", "invalid-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(400);
    }

    // [Employee-Controller][Integration Test][Negative] Update employee with non-existing ID -> returns 404
    @Test
    void whenUpdateEmployee_withNonExistingId_thenReturns404() {
        String nonExistingId = "00000000-0000-0000-0000-000000000000";

        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("Jane")
                .lastName("Smith")
                .userId("janesmith")
                .employeeRole(testEmployee.getEmployeeRole())
                .build();

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}", nonExistingId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(400);
    }

    // [Employee-Controller][Integration Test][Negative] Update employee invalid role change (TECHNICIAN to non-TECHNICIAN) -> returns 400
    @Test
    void whenUpdateEmployee_withInvalidRoleChange_thenReturns400() {
        EmployeeRole newRole = new EmployeeRole();
        newRole.setEmployeeRoleType(EmployeeRoleType.ADMIN); // TECHNICIAN -> ADMIN not allowed

        EmployeeRequestModel request = EmployeeRequestModel.builder()
                .firstName("John")
                .lastName("Doe")
                .userId("johndoe")
                .phoneNumbers(testEmployee.getPhoneNumbers())
                .employeeAddress(testEmployee.getEmployeeAddress())
                .employeeRole(newRole)
                .build();

        webTestClient.put()
                .uri("/api/v1/employees/{employeeId}", testEmployeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isBadRequest();

        // Verify role unchanged in database
        Employee unchanged = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(testEmployeeId);
        assertEquals(EmployeeRoleType.TECHNICIAN, unchanged.getEmployeeRole().getEmployeeRoleType());
    }
}
