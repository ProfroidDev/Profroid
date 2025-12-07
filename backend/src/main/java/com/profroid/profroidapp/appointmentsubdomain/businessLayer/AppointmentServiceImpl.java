package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.*;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentRequestMapper;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentResponseMapper;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.appointmentsubdomain.utils.AppointmentValidationUtils;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRoleType;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.Schedule;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeScheduleDataAccessLayer.ScheduleRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.Job;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobRepository;
import com.profroid.profroidapp.jobssubdomain.dataAccessLayer.JobType;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentRequestMapper appointmentRequestMapper;
    private final AppointmentResponseMapper appointmentResponseMapper;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final JobRepository jobRepository;
    private final CellarRepository cellarRepository;
    private final EmployeeResponseMapper employeeResponseMapper;
    private final ScheduleRepository scheduleRepository;
    private final AppointmentValidationUtils validationUtils;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  AppointmentRequestMapper appointmentRequestMapper,
                                  AppointmentResponseMapper appointmentResponseMapper,
                                  CustomerRepository customerRepository,
                                  EmployeeRepository employeeRepository,
                                  JobRepository jobRepository,
                                  CellarRepository cellarRepository,
                                  EmployeeResponseMapper employeeResponseMapper,
                                  ScheduleRepository scheduleRepository,
                                  AppointmentValidationUtils validationUtils) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentRequestMapper = appointmentRequestMapper;
        this.appointmentResponseMapper = appointmentResponseMapper;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.jobRepository = jobRepository;
        this.cellarRepository = cellarRepository;
        this.employeeResponseMapper = employeeResponseMapper;
        this.scheduleRepository = scheduleRepository;
        this.validationUtils = validationUtils;
    }

    @Override
    public AppointmentResponseModel addAppointment(AppointmentRequestModel requestModel, String userId, String userRole) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime appointmentDateTime = requestModel.getAppointmentDate();

        if (appointmentDateTime.isBefore(now)) {
            throw new InvalidOperationException(
                "Cannot book an appointment in the past. Appointment time: " + appointmentDateTime + 
                ", Current time: " + now
            );
        }

        if (appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || 
            appointmentDateTime.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            throw new InvalidOperationException(
                "Appointments cannot be scheduled on weekends (Saturday or Sunday). " +
                "Please choose a weekday. Requested date: " + appointmentDateTime.toLocalDate() + 
                " (" + appointmentDateTime.getDayOfWeek() + ")"
            );
        }

        validationUtils.validateBookingDeadline(appointmentDateTime, now);

        Customer customer;
        Employee technician;
        
        // Determine customer based on user role
        if ("CUSTOMER".equals(userRole)) {
            // Customer booking for themselves
            customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
            if (customer == null) {
                throw new ResourceNotFoundException("Customer " + userId + " not found.");
            }
        } else {
            // Technician or other role booking for a customer
            // Customer must be specified in request by customerId
            if (requestModel.getCustomerId() == null || requestModel.getCustomerId().isEmpty()) {
                throw new InvalidOperationException(
                    "When technician creates an appointment, customer ID must be provided in the request body."
                );
            }
            
            customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(
                requestModel.getCustomerId()
            );
            
            if (customer == null) {
                throw new ResourceNotFoundException(
                    "Customer not found with ID: " + requestModel.getCustomerId()
                );
            }
        }
        
        // Find technician by name
        List<Employee> technicianCandidates = employeeRepository.findByFirstNameAndLastName(
            requestModel.getTechnicianFirstName(), 
            requestModel.getTechnicianLastName()
        );
        
        if (technicianCandidates.isEmpty()) {
            throw new ResourceNotFoundException(
                "Technician not found: " + requestModel.getTechnicianFirstName() + 
                " " + requestModel.getTechnicianLastName()
            );
        }
        
        // Filter for active technicians with TECHNICIAN role
        technician = technicianCandidates.stream()
            .filter(Employee::getIsActive)
            .filter(e -> e.getEmployeeRole().getEmployeeRoleType() == EmployeeRoleType.TECHNICIAN)
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException(
                "No active technician found with the name: " + requestModel.getTechnicianFirstName() + 
                " " + requestModel.getTechnicianLastName()
            ));
        
        // Find job by name
        Job job = jobRepository.findJobByJobName(requestModel.getJobName());
        if (job == null) {
            throw new ResourceNotFoundException("Job not found: " + requestModel.getJobName());
        }
        
        if (!job.isActive()) {
            throw new InvalidOperationException("Job " + requestModel.getJobName() + " is not active.");
        }
        
        // Find cellar by name
        Cellar cellar = cellarRepository.findCellarByName(requestModel.getCellarName());
        if (cellar == null) {
            throw new ResourceNotFoundException("Cellar not found: " + requestModel.getCellarName());
        }
        validationUtils.validateCellarOwnership(cellar, customer);
        validationUtils.validateTechnicianSchedule(technician, appointmentDateTime);
        validationUtils.validateServiceTypeRestrictions(job.getJobType(), userRole);
        validationUtils.validateQuotationCompleted(job.getJobType(), requestModel, customer, appointmentDateTime);
        validationUtils.validateDuplicateQuotation(job.getJobType(), requestModel, appointmentDateTime.toLocalDate(), customer);
        validationUtils.validateDuplicateServiceAddressAndDay(job.getJobType(), requestModel, appointmentDateTime.toLocalDate());
        validationUtils.validateTimeSlotAvailability(technician, appointmentDateTime, job);
        

        Appointment appointment = appointmentRequestMapper.toEntity(requestModel);
        appointment.setCustomer(customer);
        appointment.setTechnician(technician);
        appointment.setJob(job);
        appointment.setCellar(cellar);
        appointment.setSchedule(null); // Schedule can be set later if needed
        
        // Save appointment
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        return appointmentResponseMapper.toResponseModel(savedAppointment);
    }

    @Override
    public List<AppointmentResponseModel> getCustomerAppointments(String customerId) {
       
        Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);
        
        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }


        List<Appointment> appointments = appointmentRepository.findAllByCustomer(customer);

        return appointmentResponseMapper.toResponseModelList(
            validateAppointmentEntities(appointments)
        );
    }

    @Override
    public List<AppointmentResponseModel> getTechnicianAppointments(String technicianId) {
        // Find technician by their employee identifier (UUID)
        Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(technicianId);
        
        if (technician == null) {
            throw new ResourceNotFoundException("Technician " + technicianId + " not found.");
        }
        
        // Prevent deactivated technicians from accessing appointments
        if (!technician.getIsActive()) {
            throw new ResourceNotFoundException("Technician " + technicianId + " is deactivated and cannot access appointments.");
        }

        // Get all appointments for this technician
        List<Appointment> appointments = appointmentRepository.findAllByTechnician(technician);
        
        // Validate all appointments have valid related entities (in case some were deleted)
        return appointmentResponseMapper.toResponseModelList(
            validateAppointmentEntities(appointments)
        );
    }

    @Override
    public AppointmentResponseModel getAppointmentById(String appointmentId, String userId, String userRole) {
        // Find appointment by ID
        Optional<Appointment> appointmentOptional = appointmentRepository.findAppointmentByAppointmentIdentifier_AppointmentId(appointmentId);
        
        if (appointmentOptional.isEmpty()) {
            throw new ResourceNotFoundException("Appointment " + appointmentId + " not found.");
        }

        Appointment appointment = appointmentOptional.get();

        validateAppointmentEntityIntegrity(appointment);

        if ("CUSTOMER".equals(userRole)) {
            Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
            if (customer == null || !customer.getId().equals(appointment.getCustomer().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        } else if ("TECHNICIAN".equals(userRole)) {
            Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(userId);
            
            if (technician == null) {
                throw new ResourceNotFoundException("Technician not found.");
            }
            
            // Prevent deactivated technicians from accessing appointments
            if (!technician.getIsActive()) {
                throw new ResourceNotFoundException("You are deactivated and cannot access appointments.");
            }
            
            if (!technician.getId().equals(appointment.getTechnician().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        }

        return appointmentResponseMapper.toResponseModel(appointment);
    }


    private void validateAppointmentEntityIntegrity(Appointment appointment) {
        if (appointment.getCustomer() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid customer (customer may have been deleted)."
            );
        }
        
        if (appointment.getTechnician() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid technician (technician may have been deleted)."
            );
        }
        
        if (appointment.getJob() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid job (job may have been deleted)."
            );
        }
        
        if (appointment.getCellar() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid cellar (cellar may have been deleted)."
            );
        }
    }
    
 
    private List<Appointment> validateAppointmentEntities(List<Appointment> appointments) {
        return appointments.stream()
            .filter(appointment -> {
                try {
                    validateAppointmentEntityIntegrity(appointment);
                    return true;
                } catch (ResourceNotFoundException e) {
                    return false;
                }
            })
            .toList();
    }
}