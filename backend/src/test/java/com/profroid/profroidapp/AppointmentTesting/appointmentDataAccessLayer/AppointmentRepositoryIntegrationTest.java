

package com.profroid.profroidapp.AppointmentTesting.appointmentDataAccessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobIdentifier;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeAddress;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentAddress;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
public class AppointmentRepositoryIntegrationTest {
        @Autowired
        private CellarRepository cellarRepository;
    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private Appointment buildAppointment(String appointmentId) {
        Appointment appointment = new Appointment();
        appointment.setAppointmentIdentifier(new AppointmentIdentifier(appointmentId));
        appointment.setAppointmentDate(LocalDateTime.now());
        appointment.setIsActive(true);

        // Persist Customer
        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier("c-1"));
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer = customerRepository.save(customer);
        appointment.setCustomer(customer);

        // Persist Technician
        Employee technician = new Employee();
        technician.setEmployeeIdentifier(new EmployeeIdentifier("e-1"));
        technician.setFirstName("Jane");
        technician.setLastName("Smith");
        technician.setUserId("user-e-1");
        // Set required EmployeeAddress
        technician.setEmployeeAddress(
            EmployeeAddress.builder()
                .streetAddress("100 Tech St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1T 1T1")
                .build()
        );
        // Set required EmployeeRole
        EmployeeRole empRole = new EmployeeRole();
        empRole.setEmployeeRoleType(EmployeeRoleType.TECHNICIAN);
        technician.setEmployeeRole(empRole);
        technician = employeeRepository.save(technician);
        appointment.setTechnician(technician);

        // Persist Cellar
        Cellar cellar = new Cellar();
        cellar.setCellarIdentifier(new CellarIdentifier("cellar-1"));
        cellar.setName("Main Cellar");
        cellar.setOwnerCustomerIdentifier(customer.getCustomerIdentifier());
        cellar.setOwnerCustomer(customer);
        cellar.setHeight(2.5);
        cellar.setWidth(3.0);
        cellar.setDepth(4.0);
        cellar.setBottleCapacity(100);
        cellar.setHasCoolingSystem(true);
        cellar.setHasHumidityControl(false);
        cellar.setHasAutoRegulation(false);
        cellar.setCellarType(CellarType.PRIVATE);
        cellar = cellarRepository.save(cellar);
        appointment.setCellar(cellar);

        // Set required description
        appointment.setDescription("Test appointment description");

        // Set required AppointmentAddress
        appointment.setAppointmentAddress(AppointmentAddress.builder()
            .streetAddress("123 Main St")
            .city("Montreal")
            .province("Quebec")
            .postalCode("H1A 1A1")
            .build());

        // Persist Job
        Job job = new Job();
        job.setJobIdentifier(new JobIdentifier());
        job.setJobName("Repair");
        job.setJobDescription("Test repair job");
        job.setHourlyRate(50.0);
        job.setEstimatedDurationMinutes(60);
        job.setJobType(JobType.REPARATION);
        job.setActive(true);
        job = jobRepository.save(job);
        appointment.setJob(job);

        return appointment;
    }

    // -------------------------------------------------------------------------
    // FIND BY APPOINTMENT IDENTIFIER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveAppointment_thenCanFindByAppointmentIdentifier() {
        Appointment saved = appointmentRepository.save(buildAppointment("appointment123"));
        assertNotNull(saved.getId());

        Appointment found = appointmentRepository
                .findAppointmentByAppointmentIdentifier_AppointmentId("appointment123")
                .orElse(null);

        assertNotNull(found);
        assertEquals("appointment123", found.getAppointmentIdentifier().getAppointmentId());
    }

    // -------------------------------------------------------------------------
    // FIND ALL BY CUSTOMER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveAppointment_thenCanFindAllByCustomer() {
        Appointment appointment = buildAppointment("appointment456");
        Customer customer = appointment.getCustomer();
        appointmentRepository.save(appointment);

        List<Appointment> foundAppointments = appointmentRepository.findAllByCustomer(customer);

        assertFalse(foundAppointments.isEmpty());
        assertEquals(customer.getFirstName(), foundAppointments.get(0).getCustomer().getFirstName());
    }

    // -------------------------------------------------------------------------
    // FIND ALL BY TECHNICIAN
    // -------------------------------------------------------------------------
    @Test
    void whenSaveAppointment_thenCanFindAllByTechnician() {
        Appointment appointment = buildAppointment("appointment789");
        Employee technician = appointment.getTechnician();
        appointmentRepository.save(appointment);

        List<Appointment> foundAppointments = appointmentRepository.findAllByTechnician(technician);

        assertFalse(foundAppointments.isEmpty());
        assertEquals(technician.getFirstName(), foundAppointments.get(0).getTechnician().getFirstName());
    }

    // -------------------------------------------------------------------------
    // FIND ALL ACTIVE APPOINTMENTS
    // -------------------------------------------------------------------------
    @Test
    void whenSaveAppointment_thenCanFindAllActiveAppointments() {
        Appointment appointment = buildAppointment("appointmentActive");
        appointment.setIsActive(true);
        appointmentRepository.save(appointment);

        List<Appointment> activeAppointments = appointmentRepository.findAllByIsActiveTrue();

        assertFalse(activeAppointments.isEmpty());
        assertTrue(activeAppointments.get(0).getIsActive());
    }


}
