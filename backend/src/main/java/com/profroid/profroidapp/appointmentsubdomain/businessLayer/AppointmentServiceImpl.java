package com.profroid.profroidapp.appointmentsubdomain.businessLayer;

import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.Appointment;
import com.profroid.profroidapp.appointmentsubdomain.dataAccessLayer.AppointmentRepository;
import com.profroid.profroidapp.appointmentsubdomain.mappingLayer.AppointmentResponseMapper;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentRequestModel;
import com.profroid.profroidapp.appointmentsubdomain.presentationLayer.AppointmentResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.Employee;
import com.profroid.profroidapp.employeesubdomain.dataAccessLayer.employeeDataAccessLayer.EmployeeRepository;
import com.profroid.profroidapp.employeesubdomain.mappingLayer.employeeMappers.EmployeeResponseMapper;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentResponseMapper appointmentResponseMapper;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeResponseMapper employeeResponseMapper;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  AppointmentResponseMapper appointmentResponseMapper,
                                  CustomerRepository customerRepository,
                                  EmployeeRepository employeeRepository,
                                  EmployeeResponseMapper employeeResponseMapper) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentResponseMapper = appointmentResponseMapper;
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
        this.employeeResponseMapper = employeeResponseMapper;
    }

    @Override
    public List<AppointmentResponseModel> getCustomerAppointments(String customerId) {
       
        Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);
        
        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }

        // Get all appointments for this customer
        List<Appointment> appointments = appointmentRepository.findAllByCustomer(customer);
        
        // Validate all appointments have valid related entities (in case some were deleted)
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
        
        // Validate that all related entities still exist
        validateAppointmentEntityIntegrity(appointment);

        if ("CUSTOMER".equals(userRole)) {
            Customer customer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(userId);
            if (customer == null || !customer.getId().equals(appointment.getCustomer().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        } else if ("TECHNICIAN".equals(userRole)) {
            Employee technician = employeeRepository.findEmployeeByEmployeeIdentifier_EmployeeId(userId);
            if (technician == null || !technician.getId().equals(appointment.getTechnician().getId())) {
                throw new ResourceNotFoundException("You don't have permission to view this appointment.");
            }
        }

        return appointmentResponseMapper.toResponseModel(appointment);
    }

    /**
     * Validates that an appointment has all required entities (customer, technician, job, cellar, schedule).
     * Throws ResourceNotFoundException if any entity is null (indicating it was deleted).
     * This prevents null pointer exceptions when mapping the appointment to response model.
     */
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
        
        if (appointment.getSchedule() == null) {
            throw new ResourceNotFoundException(
                "Appointment " + appointment.getAppointmentIdentifier().getAppointmentId() + 
                " has invalid schedule (schedule may have been deleted)."
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