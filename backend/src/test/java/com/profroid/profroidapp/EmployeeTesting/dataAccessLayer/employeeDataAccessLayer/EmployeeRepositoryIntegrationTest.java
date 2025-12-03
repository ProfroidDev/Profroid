package com.profroid.profroidapp.EmployeeTesting.dataAccessLayer.employeeDataAccessLayer;

import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class EmployeeRepositoryIntegrationTest {

	@Autowired
	private EmployeeRepository employeeRepository;

	private Employee buildEmployee(String userId) {
		EmployeePhoneNumber phone = new EmployeePhoneNumber();
		phone.setType(EmployeePhoneType.MOBILE);
		phone.setNumber("514-123-4567");

		EmployeeAddress address = EmployeeAddress.builder()
				.streetAddress("123 Main St")
				.city("Montreal")
				.province("Quebec")
				.country("Canada")
				.postalCode("H1A 1A1")
				.build();

		EmployeeRole role = new EmployeeRole();
		role.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);

		Employee employee = new Employee();
		employee.setEmployeeIdentifier(new EmployeeIdentifier());
		employee.setFirstName("John");
		employee.setLastName("Doe");
		employee.setPhoneNumbers(Arrays.asList(phone));
		employee.setEmployeeAddress(address);
		employee.setEmployeeRole(role);
		employee.setUserId(userId);
		return employee;
	}

	@Test
	void whenSaveEmployee_thenCanFindByUserId() {
		Employee saved = employeeRepository.save(buildEmployee("johndoe"));
		assertNotNull(saved.getId());

		Employee found = employeeRepository.findEmployeeByUserId("johndoe");
		assertNotNull(found);
		assertEquals("johndoe", found.getUserId());
	}

	@Test
	void whenSaveEmployee_thenCanFindByEmployeeIdentifier() {
		Employee saved = employeeRepository.save(buildEmployee("janesmith"));
		String employeeId = saved.getEmployeeIdentifier().getEmployeeId();
		assertNotNull(employeeId);

		Employee found = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(employeeId);
		assertNotNull(found);
		assertEquals(employeeId, found.getEmployeeIdentifier().getEmployeeId());
	}
}
