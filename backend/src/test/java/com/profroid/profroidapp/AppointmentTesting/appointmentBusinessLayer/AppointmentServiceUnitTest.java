
package com.profroid.profroidapp.AppointmentTesting.appointmentBusinessLayer;

import com.profroid.profroidapp.appointmentsubdomain.businessLayer.AppointmentServiceImpl;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatus;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentStatusType;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentRequestMapper;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentResponseMapper;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.*;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlotType;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.appointmentsubdomain.utils.AppointmentValidationUtils;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceUnitTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AppointmentRequestMapper appointmentRequestMapper;
    @Mock private AppointmentResponseMapper appointmentResponseMapper;
    @Mock private CustomerRepository customerRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private JobRepository jobRepository;
    @Mock private CellarRepository cellarRepository;
    @Mock private EmployeeResponseMapper employeeResponseMapper;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private AppointmentValidationUtils validationUtils;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private AppointmentRequestModel requestModel;
    private AppointmentResponseModel responseModel;
    private Appointment appointment;

    // Shared mocks for entity references
    private com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee mockTechnician;
    private com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job mockJob;
    private com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar mockCellar;

    @BeforeEach
    void setup() {
        // Create mocks first
        requestModel = mock(AppointmentRequestModel.class);
        responseModel = mock(AppointmentResponseModel.class);
        appointment = mock(Appointment.class);

        // Mock cellar lookup - the service uses findCellarByNameAndOwnerCustomerIdentifier_CustomerId
        lenient().when(requestModel.getCellarName()).thenReturn("Main Cellar"); // Use a cellar name from data.sql
        mockCellar = mock(com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar.class);
        lenient().when(cellarRepository.findCellarByNameAndOwnerCustomerIdentifier_CustomerId(anyString(), anyString())).thenReturn(mockCellar);
        lenient().when(cellarRepository.findCellarByName(anyString())).thenReturn(mockCellar);

        // Mock technician name lookup
        lenient().when(requestModel.getTechnicianFirstName()).thenReturn("Bob");
        lenient().when(requestModel.getTechnicianLastName()).thenReturn("Williams");

        mockTechnician = new com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee();
        mockTechnician.setFirstName("Bob");
        mockTechnician.setLastName("Williams");
        mockTechnician.setIsActive(true);
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole role = new com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole();
        role.setEmployeeRoleType(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.TECHNICIAN);
        mockTechnician.setEmployeeRole(role);
        lenient().when(employeeRepository.findByFirstNameAndLastName("Bob", "Williams")).thenReturn(java.util.Collections.singletonList(mockTechnician));

        // Ensure getAppointmentDate returns a valid date
        lenient().when(requestModel.getAppointmentDate())
                .thenReturn(LocalDateTime.of(2050, 1, 6, 10, 0));

        // Mock job lookup
        lenient().when(requestModel.getJobName()).thenReturn("Installation"); // Use a job name from data.sql
        mockJob = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        mockJob.setJobName("Installation");
        lenient().when(mockJob.isActive()).thenReturn(true);
        lenient().when(jobRepository.findJobByJobName(anyString())).thenReturn(mockJob);
        lenient().when(jobRepository.findJobByJobName(null)).thenReturn(mockJob);

        // Mock customerRepository to return a valid customer for userId
        Customer mockCustomer = new Customer();
        // Use existing data from data.sql
        mockCustomer.setUserId("f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd"); // John Doe's userId
        mockCustomer.setFirstName("John");
        mockCustomer.setLastName("Doe");
        mockCustomer.setCustomerIdentifier(new CustomerIdentifier("123e4567-e89b-12d3-a456-426614174000"));
        mockCustomer.setIsActive(true);
        lenient().when(customerRepository.findCustomerByUserId("f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd")).thenReturn(mockCustomer);
        // Also mock lookup by customerId
        lenient().when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("123e4567-e89b-12d3-a456-426614174000")).thenReturn(mockCustomer);
        lenient().when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd")).thenReturn(mockCustomer);
    }

    @Test
    void addAppointment_validRequest_returnsResponse() {
        // Setup mocks for required repository and mapper calls
        when(appointmentRequestMapper.toEntity(requestModel)).thenReturn(appointment);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        when(appointmentResponseMapper.toResponseModel(appointment)).thenReturn(responseModel);

        // You may need to mock additional repository calls for customer, technician, job, cellar, etc.
        // For brevity, this is a minimal example

        AppointmentResponseModel result = appointmentService.addAppointment(requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER");
        assertNotNull(result);
        verify(appointmentRepository).save(any(Appointment.class));
        verify(appointmentResponseMapper).toResponseModel(appointment);
    }

    // Add more tests for getCustomerAppointments, getTechnicianAppointments, etc. as needed

    @Test
    void getCustomerAppointments_validCustomer_returnsList() {
        Customer mockCustomer = new Customer();
        mockCustomer.setCustomerIdentifier(new CustomerIdentifier("123e4567-e89b-12d3-a456-426614174000"));
        lenient().when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("123e4567-e89b-12d3-a456-426614174000")).thenReturn(mockCustomer);

        Appointment mockAppointment = mock(Appointment.class);
        com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier mockIdentifier = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class);
        lenient().when(mockIdentifier.getAppointmentId()).thenReturn("appt-uuid");
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mockIdentifier);
        // Also stub required entity getters for integrity check
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        lenient().when(appointmentRepository.findAllByCustomer(mockCustomer)).thenReturn(java.util.Collections.singletonList(mockAppointment));
        lenient().when(appointmentResponseMapper.toResponseModelList(anyList())).thenReturn(java.util.Collections.singletonList(responseModel));

        var result = appointmentService.getCustomerAppointments("123e4567-e89b-12d3-a456-426614174000");
        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(appointmentRepository).findAllByCustomer(mockCustomer);
        verify(appointmentResponseMapper).toResponseModelList(anyList());
    }

    @Test
    void getTechnicianAppointments_validTechnician_returnsList() {
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee mockTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-uuid")).thenReturn(mockTechnician);
        lenient().when(mockTechnician.getIsActive()).thenReturn(true);

        Appointment mockAppointment = mock(Appointment.class);
        com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier mockIdentifier = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class);
        lenient().when(mockIdentifier.getAppointmentId()).thenReturn("appt-uuid");
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mockIdentifier);
        // Also stub required entity getters for integrity check
        lenient().when(mockAppointment.getCustomer()).thenReturn(new Customer());
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        lenient().when(appointmentRepository.findAllByTechnician(mockTechnician)).thenReturn(java.util.Collections.singletonList(mockAppointment));
        lenient().when(appointmentResponseMapper.toResponseModelList(anyList())).thenReturn(java.util.Collections.singletonList(responseModel));

        var result = appointmentService.getTechnicianAppointments("tech-uuid");
        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(appointmentRepository).findAllByTechnician(mockTechnician);
        verify(appointmentResponseMapper).toResponseModelList(anyList());
    }

    @Test
    void getAppointmentById_validId_returnsResponse() {
        Appointment mockAppointment = mock(Appointment.class);
        com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier mockIdentifier = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class);
        lenient().when(mockIdentifier.getAppointmentId()).thenReturn("appt-uuid");
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mockIdentifier);
        // Create a single mockCustomer and stub getId()
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1); // Non-null ID
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        // Also stub repository to return this mockCustomer if needed
        lenient().when(customerRepository.findCustomerByUserId(anyString())).thenReturn(mockCustomer);
        lenient().when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        lenient().when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-uuid")).thenReturn(java.util.Optional.of(mockAppointment));
        lenient().when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);

        var result = appointmentService.getAppointmentById("appt-uuid", "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER");
        assertNotNull(result);
        verify(appointmentRepository).findAppointmentByAppointmentIdentifier_AppointmentId("appt-uuid");
        verify(appointmentResponseMapper).toResponseModel(mockAppointment);
    }

    @Test
    void getAppointmentById_wrongCustomer_permissionDenied() {
        Appointment mockAppointment = mock(Appointment.class);
        Customer appointmentCustomer = mock(Customer.class);
        lenient().when(appointmentCustomer.getId()).thenReturn(2);
        lenient().when(mockAppointment.getCustomer()).thenReturn(appointmentCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class));
        lenient().when(mockAppointment.getCellar()).thenReturn(mock(Cellar.class));
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        Customer wrongCustomer = mock(Customer.class);
        lenient().when(wrongCustomer.getId()).thenReturn(1);
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(wrongCustomer);
        assertThrows(ResourceNotFoundException.class, () ->
            appointmentService.getAppointmentById("appt-uuid", "wrong-user-id", "CUSTOMER")
        );
    }

        @Test
        void getAppointmentById_wrongTechnician_permissionDenied() {
            Appointment mockAppointment = mock(Appointment.class);
            com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
            lenient().when(appointmentTechnician.getId()).thenReturn(2);
            lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);
            lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
            lenient().when(mockAppointment.getJob()).thenReturn(mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class));
            lenient().when(mockAppointment.getCellar()).thenReturn(mock(Cellar.class));
            when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
            com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee wrongTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
            lenient().when(wrongTechnician.getId()).thenReturn(1);
            lenient().when(wrongTechnician.getIsActive()).thenReturn(true);
            when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(anyString())).thenReturn(wrongTechnician);
            assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getAppointmentById("appt-uuid", "wrong-tech-id", "TECHNICIAN")
            );
        }

    @Test
    void addAppointment_pastDate_throwsInvalidOperationException() {
        when(requestModel.getAppointmentDate()).thenReturn(java.time.LocalDateTime.now().minusDays(1));
        assertThrows(InvalidOperationException.class, () ->
                appointmentService.addAppointment(requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER")
        );
    }

    @Test
    void addAppointment_weekendDate_throwsInvalidOperationException() {
        // Find the next Saturday
        java.time.LocalDateTime saturday = java.time.LocalDateTime.now().plusDays(1);
        while (saturday.getDayOfWeek() != java.time.DayOfWeek.SATURDAY) {
            saturday = saturday.plusDays(1);
        }
        when(requestModel.getAppointmentDate()).thenReturn(saturday);
        assertThrows(InvalidOperationException.class, () ->
                appointmentService.addAppointment(requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER")
        );
    }

    @Test
    void addAppointment_customerNotFound_throwsResourceNotFoundException() {
        // Override the setup's lenient stubbing for this specific test case
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(null);
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.addAppointment(requestModel, "non-existent-id", "CUSTOMER")
        );
    }

    @Test
    void addAppointment_technicianNotFound_throwsResourceNotFoundException() {
        // Override the setup's lenient stubbing
        when(employeeRepository.findByFirstNameAndLastName(anyString(), anyString())).thenReturn(java.util.Collections.emptyList());

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.addAppointment(requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER")
        );
    }

    @Test
    void addAppointment_inactiveJob_throwsInvalidOperationException() {
        // Override the setup's mockJob
        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job inactiveJob = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);

        // Use lenient().when() to resolve the UnnecessaryStubbingException, as the method exits early with an exception.
        lenient().when(inactiveJob.isActive()).thenReturn(false);
        lenient().when(inactiveJob.getJobName()).thenReturn("InactiveJob");

        // These stubs override the global setup and must be marked lenient to prevent the exception.
        lenient().when(jobRepository.findJobByJobName("InactiveJob")).thenReturn(inactiveJob);
        lenient().when(requestModel.getJobName()).thenReturn("InactiveJob"); // Must match the stubbed name

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.addAppointment(requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER")
        );
    }

    @Test
    void getCustomerAppointments_customerNotFound_throwsResourceNotFoundException() {
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("non-existent-id")).thenReturn(null);
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getCustomerAppointments("non-existent-id")
        );
    }

    @Test
    void getTechnicianAppointments_technicianNotFound_throwsResourceNotFoundException() {
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("non-existent-id")).thenReturn(null);
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getTechnicianAppointments("non-existent-id")
        );
    }

    @Test
    void getTechnicianAppointments_deactivatedTechnician_throwsResourceNotFoundException() {
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee mockTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("deactivated-tech")).thenReturn(mockTechnician);
        when(mockTechnician.getIsActive()).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getTechnicianAppointments("deactivated-tech")
        );
    }

    @Test
    void getAppointmentById_missingAppointment_throwsResourceNotFoundException() {
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("non-existent-id")).thenReturn(java.util.Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getAppointmentById("non-existent-id", "some-user", "CUSTOMER")
        );
    }

    @Test
    void getAppointmentById_technicianRole_successful() {
        Appointment mockAppointment = mock(Appointment.class);
        com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier mockIdentifier = mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class);
        lenient().when(mockIdentifier.getAppointmentId()).thenReturn("appt-uuid");
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mockIdentifier);

        // Setup technician for the appointment
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(appointmentTechnician.getIsActive()).thenReturn(true);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);

        // Setup user technician
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(appointmentTechnician);

        // Setup other required entities for integrity check
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-uuid")).thenReturn(java.util.Optional.of(mockAppointment));
        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);

        var result = appointmentService.getAppointmentById("appt-uuid", "tech-id", "TECHNICIAN");
        assertNotNull(result);
    }

    @Test
    void getAppointmentById_deactivatedTechnician_permissionDenied() {
        Appointment mockAppointment = mock(Appointment.class);
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);

        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee deactivatedTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(deactivatedTechnician.getIsActive()).thenReturn(false);
        lenient().when(deactivatedTechnician.getId()).thenReturn(1); // Same ID as appointment technician
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("deactivated-tech")).thenReturn(deactivatedTechnician);

        lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class));
        lenient().when(mockAppointment.getCellar()).thenReturn(mock(Cellar.class));
        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.getAppointmentById("appt-uuid", "deactivated-tech", "TECHNICIAN")
        );
    }

    @Test
    void updateAppointment_completedStatus_throwsInvalidOperationException() {
        // Mock appointment with COMPLETED status
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus completedStatus = mock(AppointmentStatus.class);
        when(completedStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.COMPLETED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(completedStatus);

        // Setup required entities for integrity check and permission
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));

        // This stub is marked lenient because the InvalidOperationException (due to COMPLETED status)
        // is thrown *before* the service attempts the permission check (which calls this repository).
        lenient().when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "user-id", "CUSTOMER")
        );
    }

    @Test
    void patchAppointmentStatus_customerCancels_successful() {
        // Setup appointment in a non-cancelled state
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus pendingStatus = mock(AppointmentStatus.class);
        when(pendingStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(pendingStatus);

        // Setup required entities for integrity check and permission
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        // Setup status change request to CANCELLED
        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");

        // Mock save
        when(appointmentRepository.save(mockAppointment)).thenReturn(mockAppointment);
        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);

        appointmentService.patchAppointmentStatus("appt-id", statusRequest, "user-id", "CUSTOMER");

        // Verify status was set to CANCELLED and schedule was cleared
        verify(mockAppointment, times(1)).setAppointmentStatus(any(AppointmentStatus.class));
        verify(mockAppointment, times(1)).setSchedule(null);
        verify(appointmentRepository).save(mockAppointment);
    }

    @Test
    void patchAppointmentStatus_customerTriesToComplete_throwsInvalidOperationException() {
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus pendingStatus = mock(AppointmentStatus.class);
        when(pendingStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.COMPLETED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(pendingStatus);

        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("COMPLETED");

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "user-id", "CUSTOMER")
        );
    }

    // --- New Tests for updateAppointment ---

//    @Test
//    void updateAppointment_customerRole_successful() {
//        // 1. Setup Appointment to be updated (must be non-COMPLETED)
//        Appointment mockAppointment = mock(Appointment.class);
//        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
//        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
//        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);
//
//        // 2. Setup the Customer associated with the appointment (used for permission check)
//        Customer appointmentCustomer = new Customer();
//        appointmentCustomer.setUserId("f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd"); // Same as userId in call
//        CustomerIdentifier customerIdentifier = new CustomerIdentifier("123e4567-e89b-12d3-a456-426614174000");
//        appointmentCustomer.setCustomerIdentifier(customerIdentifier);
//        appointmentCustomer.setId(1); // Crucial for permission check
//
//        // 3. Stub the required entities and mappers
//        lenient().when(mockAppointment.getCustomer()).thenReturn(appointmentCustomer);
//        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician); // Assuming mockTechnician is available from setup
//        lenient().when(mockAppointment.getJob()).thenReturn(mockJob); // Assuming mockJob is available from setup
//        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar); // Assuming mockCellar is available from setup
//        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));
//
//        // Stubs for update flow
//        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
//        // This finds the customer based on the userId passed to the service method
//        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd")).thenReturn(appointmentCustomer);
//        when(appointmentRepository.save(mockAppointment)).thenReturn(mockAppointment);
//        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);
//
//        // Stubs for the request model
//        // Use a deterministic weekday (Monday) to avoid weekend validation failures
//        when(requestModel.getAppointmentDate()).thenReturn(java.time.LocalDateTime.of(2040, 12, 18, 10, 0));
//        when(requestModel.getJobName()).thenReturn("Installation");
//        when(requestModel.getCellarName()).thenReturn("Main Cellar");
//
//        // Stub the validationUtils methods to pass
//        doNothing().when(validationUtils).validateCellarOwnership(any(Cellar.class), any(Customer.class));
//        doNothing().when(validationUtils).validateTechnicianSchedule(any(), any());
//        doNothing().when(validationUtils).validateServiceTypeRestrictions(any(), anyString());
//        doNothing().when(validationUtils).validateQuotationCompleted(any(), any(), any(), any());
//        doNothing().when(validationUtils).validateDuplicateQuotation(any(), any(), any(), any(), any());
//        doNothing().when(validationUtils).validateDuplicateServiceAddressAndDayExcludeCurrent(any(), any(), any(), any());
//        doNothing().when(validationUtils).validateTimeSlotAvailability(any(), any(), any());
//        doNothing().when(validationUtils).validateBookingDeadline(any(), any());
//
//        AppointmentResponseModel result = appointmentService.updateAppointment("appt-id", requestModel, "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd", "CUSTOMER");
//        assertNotNull(result);
//        verify(appointmentRepository).save(mockAppointment);
//    }

//    @Test
//    void updateAppointment_technicianRole_successful() {
//        // 1. Setup Appointment to be updated (must be non-COMPLETED)
//        Appointment mockAppointment = mock(Appointment.class);
//        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
//        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
//        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);
//
//        // 2. Setup Customer and Technician for the appointment
//        Customer appointmentCustomer = new Customer();
//        appointmentCustomer.setId(1);
//        appointmentCustomer.setCustomerIdentifier(new CustomerIdentifier("123e4567-e89b-12d3-a456-426614174000"));
//
//        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee currentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
//        lenient().when(currentTechnician.getId()).thenReturn(1);
//        lenient().when(currentTechnician.getIsActive()).thenReturn(true);
//        lenient().when(currentTechnician.getEmployeeIdentifier()).thenReturn(mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeIdentifier.class));
//
//        // 3. Stub the required entities and mappers
//        lenient().when(mockAppointment.getCustomer()).thenReturn(appointmentCustomer);
//        lenient().when(mockAppointment.getTechnician()).thenReturn(currentTechnician);
//        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
//        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
//        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));
//
//        // Stubs for update flow
//        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
//
//        // FIX: Changed to lenient().when() to resolve UnnecessaryStubbingException.
//        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(currentTechnician); // User's technician ID
//
//        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("123e4567-e89b-12d3-a456-426614174000")).thenReturn(appointmentCustomer); // Customer ID from request
//        when(appointmentRepository.save(mockAppointment)).thenReturn(mockAppointment);
//        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);
//
//        // Stubs for the request model
//        when(requestModel.getCustomerId()).thenReturn("123e4567-e89b-12d3-a456-426614174000"); // Technician must supply customerId
//        when(requestModel.getAppointmentDate()).thenReturn(java.time.LocalDateTime.of(2040, 12, 18, 10, 0));
//        when(requestModel.getJobName()).thenReturn("Installation");
//        when(requestModel.getCellarName()).thenReturn("Main Cellar");
//
//        // Stub the validationUtils methods to pass
//        doNothing().when(validationUtils).validateCellarOwnership(any(Cellar.class), any(Customer.class));
//        doNothing().when(validationUtils).validateTechnicianSchedule(any(), any());
//        doNothing().when(validationUtils).validateServiceTypeRestrictions(any(), anyString());
//        doNothing().when(validationUtils).validateQuotationCompleted(any(), any(), any(), any());
//        doNothing().when(validationUtils).validateDuplicateQuotation(any(), any(), any(), any(), any());
//        doNothing().when(validationUtils).validateDuplicateServiceAddressAndDayExcludeCurrent(any(), any(), any(), any());
//        doNothing().when(validationUtils).validateTimeSlotAvailability(any(), any(), any());
//        doNothing().when(validationUtils).validateBookingDeadline(any(), any());
//
//        AppointmentResponseModel result = appointmentService.updateAppointment("appt-id", requestModel, "tech-id", "TECHNICIAN");
//        assertNotNull(result);
//        verify(appointmentRepository).save(mockAppointment);
//    }

    @Test
    void updateAppointment_technicianRole_missingCustomerIdInRequest_throwsInvalidOperationException() {
        // Setup appointment (non-COMPLETED)
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        // Setup technician for permission (Made lenient as it may not be called)
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee currentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(currentTechnician.getId()).thenReturn(1);
        lenient().when(currentTechnician.getIsActive()).thenReturn(true);

        // FIX: Changed to lenient().when()
        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(currentTechnician);

        lenient().when(mockAppointment.getTechnician()).thenReturn(currentTechnician);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
        when(requestModel.getCustomerId()).thenReturn(null); // Missing CustomerId -> Throws Exception here

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "tech-id", "TECHNICIAN")
        );
    }

    @Test
    void updateAppointment_technicianRole_jobNotFound_throwsResourceNotFoundException() {
        // Setup Appointment (non-COMPLETED)
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        // Setup Technician for permission (Made lenient as it may not be called)
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee currentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(currentTechnician.getId()).thenReturn(1);
        lenient().when(currentTechnician.getIsActive()).thenReturn(true);

        // FIX: Changed to lenient().when()
        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(currentTechnician);

        lenient().when(mockAppointment.getTechnician()).thenReturn(currentTechnician);
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
        when(requestModel.getCustomerId()).thenReturn("123e4567-e89b-12d3-a456-426614174000"); // Valid CustomerId
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        when(requestModel.getJobName()).thenReturn("NonExistentJob");
        when(jobRepository.findJobByJobName("NonExistentJob")).thenReturn(null); // Job not found -> Throws Exception here

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "tech-id", "TECHNICIAN")
        );
    }

    @Test
    void updateAppointment_technicianRole_inactiveJob_throwsInvalidOperationException() {
        // Setup Appointment (non-COMPLETED)
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        // Setup Technician for permission (Made lenient as it may not be called)
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee currentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(currentTechnician.getId()).thenReturn(1);
        lenient().when(currentTechnician.getIsActive()).thenReturn(true);

        // FIX: Changed to lenient().when()
        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(currentTechnician);

        lenient().when(mockAppointment.getTechnician()).thenReturn(currentTechnician);
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
        when(requestModel.getCustomerId()).thenReturn("123e4567-e89b-12d3-a456-426614174000"); // Valid CustomerId
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        // Setup Inactive Job
        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job inactiveJob = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        lenient().when(inactiveJob.isActive()).thenReturn(false);
        when(requestModel.getJobName()).thenReturn("InactiveJob");
        when(jobRepository.findJobByJobName("InactiveJob")).thenReturn(inactiveJob); // Job found but inactive

        // This is the line that throws the exception:
        // if (!job.isActive()) { throw new InvalidOperationException(...) }

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "tech-id", "TECHNICIAN")
        );
    }

    @Test
    void updateAppointment_technicianRole_cellarNotFound_throwsResourceNotFoundException() {
        // Setup Appointment (non-COMPLETED)
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        // Setup Technician for permission (Made lenient as it may not be called)
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee currentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(currentTechnician.getId()).thenReturn(1);
        lenient().when(currentTechnician.getIsActive()).thenReturn(true);

        // FIX: Changed to lenient().when()
        lenient().when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(currentTechnician);

        lenient().when(mockAppointment.getTechnician()).thenReturn(currentTechnician);
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        // Mock the getCustomerIdentifier() chain for the cellar lookup
        CustomerIdentifier mockCustomerIdentifier = mock(CustomerIdentifier.class);
        lenient().when(mockCustomerIdentifier.getCustomerId()).thenReturn("123e4567-e89b-12d3-a456-426614174000");
        lenient().when(mockCustomer.getCustomerIdentifier()).thenReturn(mockCustomerIdentifier);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
        when(requestModel.getCustomerId()).thenReturn("123e4567-e89b-12d3-a456-426614174000"); // Valid CustomerId
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);
        when(requestModel.getJobName()).thenReturn("Installation");

        // Stub a successful, active job lookup (necessary to reach the Cellar lookup)
        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job activeJob = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        when(activeJob.isActive()).thenReturn(true);
        when(jobRepository.findJobByJobName("Installation")).thenReturn(activeJob);

        when(requestModel.getCellarName()).thenReturn("NonExistentCellar");
        when(cellarRepository.findCellarByNameAndOwnerCustomerIdentifier_CustomerId(eq("NonExistentCellar"), anyString())).thenReturn(null); // Cellar not found -> Throws Exception here

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "tech-id", "TECHNICIAN")
        );
    }

    @Test
    void updateAppointment_customerRole_permissionDenied_throwsResourceNotFoundException() {
        // 1. Setup Appointment
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        // 2. Setup the Customer associated with the appointment (ID=2)
        Customer appointmentCustomer = mock(Customer.class);
        lenient().when(appointmentCustomer.getId()).thenReturn(2);

        // 3. Setup the Customer attempting the update (ID=1)
        Customer wrongCustomer = mock(Customer.class);
        lenient().when(wrongCustomer.getId()).thenReturn(1);

        // 4. Stub the required entities and repository calls
        lenient().when(mockAppointment.getCustomer()).thenReturn(appointmentCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId("appt-id")).thenReturn(java.util.Optional.of(mockAppointment));
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(wrongCustomer); // User trying to update is ID=1, but appointment is for ID=2

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.updateAppointment("appt-id", requestModel, "wrong-user-id", "CUSTOMER")
        );
    }

// --- New Tests for patchAppointmentStatus ---

    @Test
    void patchAppointmentStatus_technicianCancels_successful() {
        // Setup appointment in a non-cancelled state
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus pendingStatus = mock(AppointmentStatus.class);
        when(pendingStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(pendingStatus);

        // Setup required entities for integrity check and permission
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(appointmentTechnician.getIsActive()).thenReturn(true);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(anyString())).thenReturn(appointmentTechnician);

        // Setup status change request to CANCELLED
        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");

        // Mock save
        when(appointmentRepository.save(mockAppointment)).thenReturn(mockAppointment);
        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);

        appointmentService.patchAppointmentStatus("appt-id", statusRequest, "tech-id", "TECHNICIAN");

        // Verify status was set to CANCELLED and schedule was cleared
        verify(mockAppointment, times(1)).setAppointmentStatus(any(AppointmentStatus.class));
        verify(mockAppointment, times(1)).setSchedule(null);
        verify(appointmentRepository).save(mockAppointment);
    }

    @Test
    void patchAppointmentStatus_technicianTriesToComplete_successful() {
        // Technicians ARE allowed to set status to COMPLETED
        // Setup appointment in a non-cancelled state
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus pendingStatus = mock(AppointmentStatus.class);
        when(pendingStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(pendingStatus);

        // Setup required entities for integrity check and permission
        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(appointmentTechnician.getIsActive()).thenReturn(true);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(anyString())).thenReturn(appointmentTechnician);

        // Setup status change request to COMPLETED
        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("COMPLETED");

        // Mock save
        when(appointmentRepository.save(mockAppointment)).thenReturn(mockAppointment);
        when(appointmentResponseMapper.toResponseModel(mockAppointment)).thenReturn(responseModel);

        appointmentService.patchAppointmentStatus("appt-id", statusRequest, "tech-id", "TECHNICIAN");

        // Verify status was set to COMPLETED
        verify(mockAppointment, times(1)).setAppointmentStatus(any(AppointmentStatus.class));
        verify(appointmentRepository).save(mockAppointment);
    }

    @Test
    void patchAppointmentStatus_invalidRole_throwsInvalidOperationException() {
        // Setup appointment in a non-cancelled state
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus pendingStatus = mock(AppointmentStatus.class);
        when(pendingStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(pendingStatus);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
        lenient().when(mockAppointment.getTechnician()).thenReturn(mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "some-user-id", "ADMIN") // Invalid Role
        );
    }

//    @Test
//    void patchAppointmentStatus_integrityCheck_missingCustomer_throwsResourceNotFoundException() {
//        // 1. Setup Appointment where getCustomer() returns null to trigger the integrity check
//        Appointment mockAppointment = mock(Appointment.class);
//        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
//        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
//        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);
//        lenient().when(mockAppointment.getCustomer()).thenReturn(null); // Missing Customer, triggers RNF Exception
//
//        // Stub other entities (already lenient)
//        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
//        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
//        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);
//        lenient().when(mockAppointment.getAppointmentIdentifier()).thenReturn(mock(com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentIdentifier.class));
//
//        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
//
//        // ***************************************************************
//        // REMOVED UNNECESSARY STUBBINGS (Lines 866 & 867 in your file):
//        // The setup for 'mockCustomer' and 'customerRepository' lookup is not needed
//        // because the integrity check fails before the permission check runs.
//        // ***************************************************************
//
//        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");
//
//        assertThrows(ResourceNotFoundException.class, () ->
//                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "user-id", "CUSTOMER")
//        );
//    }

    // ===== Advanced Tests for getTechnicianBookedSlots with real logic =====
    @Test
    void getTechnicianBookedSlots_withMultipleAppointments_filtersCancelled() {
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee mockTech = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(mockTech);

        java.time.LocalDate date = java.time.LocalDate.of(2025, 1, 15);
        
        // Create SCHEDULED appointment
        Appointment scheduledAppt = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(scheduledAppt.getAppointmentStatus()).thenReturn(scheduledStatus);
        when(scheduledAppt.getAppointmentDate()).thenReturn(java.time.LocalDateTime.of(2025, 1, 15, 9, 0));
        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job jobForSlot = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        when(jobForSlot.getEstimatedDurationMinutes()).thenReturn(60);
        when(scheduledAppt.getJob()).thenReturn(jobForSlot);

        // Create CANCELLED appointment
        Appointment cancelledAppt = mock(Appointment.class);
        AppointmentStatus cancelledStatus = mock(AppointmentStatus.class);
        when(cancelledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.CANCELLED);
        when(cancelledAppt.getAppointmentStatus()).thenReturn(cancelledStatus);
        lenient().when(cancelledAppt.getAppointmentDate()).thenReturn(java.time.LocalDateTime.of(2025, 1, 15, 11, 0));
        lenient().when(cancelledAppt.getJob()).thenReturn(jobForSlot);

        when(appointmentRepository.findByTechnicianAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(java.util.Arrays.asList(scheduledAppt, cancelledAppt));

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.TechnicianBookedSlotsResponseModel result = 
            appointmentService.getTechnicianBookedSlots("tech-id", date);

        // Should only include SCHEDULED, not CANCELLED
        assertEquals(1, result.getBookedSlots().size());
    }

    @Test
    void getTechnicianBookedSlots_appointmentWithNullJob_usesDefaultDuration() {
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee mockTech = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech-id")).thenReturn(mockTech);

        java.time.LocalDate date = java.time.LocalDate.of(2025, 1, 15);
        
        Appointment apptWithNullJob = mock(Appointment.class);
        AppointmentStatus status = mock(AppointmentStatus.class);
        when(status.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(apptWithNullJob.getAppointmentStatus()).thenReturn(status);
        when(apptWithNullJob.getAppointmentDate()).thenReturn(java.time.LocalDateTime.of(2025, 1, 15, 9, 0));
        when(apptWithNullJob.getJob()).thenReturn(null); // Job is null

        when(appointmentRepository.findByTechnicianAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(java.util.Collections.singletonList(apptWithNullJob));

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.TechnicianBookedSlotsResponseModel result = 
            appointmentService.getTechnicianBookedSlots("tech-id", date);

        // Should have 1 booked slot with default 60 min duration
        assertEquals(1, result.getBookedSlots().size());
    }

    // ===== Advanced Tests for getAggregatedAvailability with real filtering =====
    @Test
    void getAggregatedAvailability_filtersNonTechnicians() {
        java.time.LocalDate date = java.time.LocalDate.of(2025, 1, 15);
        
        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job mockJobForAvail = mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        when(mockJobForAvail.getEstimatedDurationMinutes()).thenReturn(120);
        when(jobRepository.findJobByJobName("Installation")).thenReturn(mockJobForAvail);

        // Create ADMIN (non-technician)
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee admin = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole adminRole = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRole.class);
        when(adminRole.getEmployeeRoleType()).thenReturn(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType.ADMIN);
        when(admin.getEmployeeRole()).thenReturn(adminRole);
        when(admin.getIsActive()).thenReturn(true);

        when(employeeRepository.findAll()).thenReturn(java.util.Collections.singletonList(admin));

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.TechnicianBookedSlotsResponseModel result = 
            appointmentService.getAggregatedAvailability(date, "Installation");

        // Should return empty list since admin is not a technician
        assertEquals(0, result.getBookedSlots().size());
    }

    // ===== Tests for patchAppointmentStatus edge cases =====
    @Test
    void patchAppointmentStatus_customerTriesToCancel_alreadyCancelled_throwsInvalidOperationException() {
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus cancelledStatus = mock(AppointmentStatus.class);
        when(cancelledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.CANCELLED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(cancelledStatus);

        Customer mockCustomer = mock(Customer.class);
        lenient().when(mockCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mockCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId(anyString())).thenReturn(mockCustomer);

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "user-id", "CUSTOMER")
        );
    }

    @Test
    void patchAppointmentStatus_technicianTriesToCancelFromCancelled_throwsInvalidOperationException() {
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus cancelledStatus = mock(AppointmentStatus.class);
        when(cancelledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.CANCELLED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(cancelledStatus);

        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(anyString())).thenReturn(appointmentTechnician);

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("COMPLETED");

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "tech-id", "TECHNICIAN")
        );
    }

    @Test
    void patchAppointmentStatus_wrongTechnician_throwsResourceNotFoundException() {
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee appointmentTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(appointmentTechnician.getId()).thenReturn(1);
        lenient().when(mockAppointment.getTechnician()).thenReturn(appointmentTechnician);
        lenient().when(mockAppointment.getCustomer()).thenReturn(mock(Customer.class));
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));

        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee wrongTechnician = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee.class);
        lenient().when(wrongTechnician.getId()).thenReturn(2); // Different ID
        lenient().when(wrongTechnician.getIsActive()).thenReturn(true);
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("wrong-tech-id")).thenReturn(wrongTechnician);

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("COMPLETED");

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "wrong-tech-id", "TECHNICIAN")
        );
    }

    @Test
    void patchAppointmentStatus_wrongCustomer_throwsResourceNotFoundException() {
        Appointment mockAppointment = mock(Appointment.class);
        AppointmentStatus scheduledStatus = mock(AppointmentStatus.class);
        when(scheduledStatus.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(mockAppointment.getAppointmentStatus()).thenReturn(scheduledStatus);

        Customer appointmentCustomer = mock(Customer.class);
        lenient().when(appointmentCustomer.getId()).thenReturn(1);
        lenient().when(mockAppointment.getCustomer()).thenReturn(appointmentCustomer);
        lenient().when(mockAppointment.getTechnician()).thenReturn(mockTechnician);
        lenient().when(mockAppointment.getJob()).thenReturn(mockJob);
        lenient().when(mockAppointment.getCellar()).thenReturn(mockCellar);

        when(appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(anyString())).thenReturn(java.util.Optional.of(mockAppointment));

        Customer wrongCustomer = mock(Customer.class);
        lenient().when(wrongCustomer.getId()).thenReturn(2); // Different ID
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("wrong-customer-id")).thenReturn(wrongCustomer);

        com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel statusRequest = new com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentStatusChangeRequestModel("CANCELLED");

        assertThrows(ResourceNotFoundException.class, () ->
                appointmentService.patchAppointmentStatus("appt-id", statusRequest, "wrong-customer-id", "CUSTOMER")
        );
    }

    @Test
    void autoAssignTechnician_noScheduleForTechnician_throwsInvalidOperationException() {
        Employee technician = mock(Employee.class);
        EmployeeRole role = mock(EmployeeRole.class);
        EmployeeIdentifier identifier = mock(EmployeeIdentifier.class);

        when(identifier.getEmployeeId()).thenReturn("tech-id");
        when(technician.getEmployeeIdentifier()).thenReturn(identifier);

        when(role.getEmployeeRoleType()).thenReturn(EmployeeRoleType.TECHNICIAN);
        when(technician.getEmployeeRole()).thenReturn(role);
        when(technician.getIsActive()).thenReturn(true);

        when(employeeRepository.findAll()).thenReturn(List.of(technician));

        when(scheduleRepository
                .findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(eq("tech-id"), any()))
                .thenReturn(Collections.emptyList());

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.autoAssignTechnician(
                        LocalDateTime.of(2040, 1, 10, 10, 0),
                        "Installation"
                )
        );
    }

    @Test
    void autoAssignTechnician_scheduleExistsButUnavailable_throwsInvalidOperationException() {
        Employee technician = mock(Employee.class);
        EmployeeRole role = mock(EmployeeRole.class);
        EmployeeIdentifier identifier = mock(EmployeeIdentifier.class);

        when(identifier.getEmployeeId()).thenReturn("tech-id");
        when(technician.getEmployeeIdentifier()).thenReturn(identifier);
        when(role.getEmployeeRoleType()).thenReturn(EmployeeRoleType.TECHNICIAN);
        when(technician.getEmployeeRole()).thenReturn(role);
        when(technician.getIsActive()).thenReturn(true);

        // Schedule exists but unavailable
        com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule schedule =
                mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule.class);

        when(employeeRepository.findAll()).thenReturn(List.of(technician));
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(
                eq("tech-id"), any()))
                .thenReturn(List.of(schedule));

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.autoAssignTechnician(
                        LocalDateTime.of(2040, 1, 10, 10, 0),
                        "Installation"
                )
        );
    }

    @Test
    void getAggregatedAvailability_activeTechnicianWithNoSchedules_returnsEmpty() {
        java.time.LocalDate date = java.time.LocalDate.of(2040, 1, 10);

        com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job job =
                mock(com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job.class);
        when(job.getEstimatedDurationMinutes()).thenReturn(60);
        when(jobRepository.findJobByJobName("Installation")).thenReturn(job);

        Employee technician = mock(Employee.class);
        EmployeeRole role = mock(EmployeeRole.class);
        EmployeeIdentifier identifier = mock(EmployeeIdentifier.class);

        when(identifier.getEmployeeId()).thenReturn("tech-id");
        when(technician.getEmployeeIdentifier()).thenReturn(identifier);
        when(role.getEmployeeRoleType()).thenReturn(EmployeeRoleType.TECHNICIAN);
        when(technician.getEmployeeRole()).thenReturn(role);
        when(technician.getIsActive()).thenReturn(true);

        when(employeeRepository.findAll()).thenReturn(List.of(technician));
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(
                eq("tech-id"), any()))
                .thenReturn(Collections.emptyList());

        var result = appointmentService.getAggregatedAvailability(date, "Installation");

        assertNotNull(result);
        assertEquals(0, result.getBookedSlots().size());
    }

    @Test
    void getCustomerAppointments_filtersInvalidAppointments() {
        Customer customer = mock(Customer.class);
        when(customerRepository.findCustomerByCustomerIdentifier_CustomerId("cid"))
                .thenReturn(customer);

        // --- VALID appointment ---
        Appointment valid = mock(Appointment.class);
        when(valid.getCustomer()).thenReturn(customer);
        lenient().when(valid.getTechnician()).thenReturn(mockTechnician);
        lenient().when(valid.getJob()).thenReturn(mockJob);
        lenient().when(valid.getCellar()).thenReturn(mockCellar);

        AppointmentIdentifier validId = mock(AppointmentIdentifier.class);
        lenient().when(validId.getAppointmentId()).thenReturn("valid-id");
        lenient().when(valid.getAppointmentIdentifier()).thenReturn(validId);

        // --- INVALID appointment (missing customer) ---
        Appointment invalid = mock(Appointment.class);
        when(invalid.getCustomer()).thenReturn(null);

        AppointmentIdentifier invalidId = mock(AppointmentIdentifier.class);
        lenient().when(invalidId.getAppointmentId()).thenReturn("invalid-id");
        lenient().when(invalid.getAppointmentIdentifier()).thenReturn(invalidId);

        when(appointmentRepository.findAllByCustomer(customer))
                .thenReturn(List.of(valid, invalid));

        when(appointmentResponseMapper.toResponseModelList(anyList()))
                .thenAnswer(i -> i.getArgument(0));

        List<?> result = appointmentService.getCustomerAppointments("cid");

        assertEquals(1, result.size());
    }



    @Test
    void getTechnicianBookedSlots_ignoresNullStatus() {
        Employee tech = mock(Employee.class);
        when(employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId("tech"))
                .thenReturn(tech);

        Appointment appt = mock(Appointment.class);
        lenient().when(appt.getAppointmentStatus()).thenReturn(null);
        lenient().when(appt.getAppointmentDate()).thenReturn(LocalDateTime.of(2025, 1, 1, 9, 0));
        lenient().when(appt.getJob()).thenReturn(null);

        when(appointmentRepository.findByTechnicianAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(List.of(appt));

        var result = appointmentService.getTechnicianBookedSlots("tech", LocalDate.of(2025, 1, 1));

        assertEquals(0, result.getBookedSlots().size());
    }

    @Test
    void autoAssignTechnician_usesWeeklySchedule_whenNoSpecificDate() {
        Employee tech = mock(Employee.class);
        EmployeeIdentifier id = mock(EmployeeIdentifier.class);
        EmployeeRole role = mock(EmployeeRole.class);

        lenient().when(id.getEmployeeId()).thenReturn("tech");
        lenient().when(role.getEmployeeRoleType()).thenReturn(EmployeeRoleType.TECHNICIAN);

        lenient().when(tech.getEmployeeIdentifier()).thenReturn(id);
        lenient().when(tech.getEmployeeRole()).thenReturn(role);
        lenient().when(tech.getIsActive()).thenReturn(true);

        Schedule weekly = mock(Schedule.class);
        lenient().when(weekly.getSpecificDate()).thenReturn(null);

        var dow = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.DayOfWeek.class);
        lenient().when(dow.getDayOfWeek()).thenReturn(
                com.profroid.profroidapp.employeesubdomain
                        .dataAccessLayer
                        .employeeScheduleDataAccessLayer
                        .DayOfWeekType.MONDAY
        );
        lenient().when(weekly.getDayOfWeek()).thenReturn(dow);

        var slot = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlot.class);
        lenient().when(slot.getTimeslot()).thenReturn(TimeSlotType.NINE_AM);
        lenient().when(weekly.getTimeSlot()).thenReturn(slot);

        Job job = mock(Job.class);
        lenient().when(jobRepository.findJobByJobName("Installation")).thenReturn(job);
        lenient().when(job.isActive()).thenReturn(true);
        lenient().when(job.getEstimatedDurationMinutes()).thenReturn(60);

        when(employeeRepository.findAll()).thenReturn(List.of(tech));
        lenient().when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(any(), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeId(any()))
                .thenReturn(List.of(weekly));
        lenient().when(appointmentRepository.findByTechnicianAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(List.of());

        // Use a date that is actually a Monday (2025-01-13 is a Monday)
        Employee assigned = appointmentService.autoAssignTechnician(
                LocalDateTime.of(2025, 1, 13, 9, 0),
                "Installation"
        );

        assertNotNull(assigned);
    }

    @Test
    void getAggregatedAvailability_blocksSlotWhenOverlappingAppointment() {
        LocalDate date = LocalDate.of(2040, 1, 8);

        Job job = mock(Job.class);
        when(job.getEstimatedDurationMinutes()).thenReturn(120);
        when(jobRepository.findJobByJobName(any())).thenReturn(job);

        Employee tech = mock(Employee.class);
        EmployeeRole role = mock(EmployeeRole.class);
        EmployeeIdentifier id = mock(EmployeeIdentifier.class);

        when(role.getEmployeeRoleType()).thenReturn(EmployeeRoleType.TECHNICIAN);
        when(id.getEmployeeId()).thenReturn("tech");
        when(tech.getEmployeeRole()).thenReturn(role);
        when(tech.getEmployeeIdentifier()).thenReturn(id);
        when(tech.getIsActive()).thenReturn(true);

        when(employeeRepository.findAll()).thenReturn(List.of(tech));

        Schedule sched = mock(Schedule.class);
        var slot = mock(com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.TimeSlot.class);
        when(slot.getTimeslot()).thenReturn(TimeSlotType.NINE_AM);
        when(sched.getTimeSlot()).thenReturn(slot);

        when(scheduleRepository.findAllByEmployee_EmployeeIdentifier_EmployeeIdAndSpecificDate(any(), any()))
                .thenReturn(List.of(sched));

        Appointment apt = mock(Appointment.class);
        when(apt.getAppointmentDate()).thenReturn(LocalDateTime.of(2040, 1, 8, 9, 0));
        when(apt.getJob()).thenReturn(job);
        AppointmentStatus st = mock(AppointmentStatus.class);
        when(st.getAppointmentStatusType()).thenReturn(AppointmentStatusType.SCHEDULED);
        when(apt.getAppointmentStatus()).thenReturn(st);

        when(appointmentRepository.findByTechnicianAndAppointmentDateBetween(any(), any(), any()))
                .thenReturn(List.of(apt));

        var result = appointmentService.getAggregatedAvailability(date, "Installation");

        assertEquals(0, result.getBookedSlots().size());
    }

    @Test
    void addAppointment_endsAfter5pm_throwsException() {
        when(requestModel.getAppointmentDate())
                .thenReturn(LocalDateTime.of(2040, 1, 8, 16, 30));

        lenient().when(mockJob.getEstimatedDurationMinutes()).thenReturn(60);

        assertThrows(InvalidOperationException.class, () ->
                appointmentService.addAppointment(
                        requestModel,
                        "f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd",
                        "CUSTOMER"
                )
        );
    }


}
