package com.profroid.profroidapp.customersubdomain.businessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerRequestMapper;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerResponseMapper;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import com.profroid.profroidapp.utils.exceptions.InvalidIdentifierException;
import com.profroid.profroidapp.utils.exceptions.ResourceAlreadyExistsException;
import com.profroid.profroidapp.utils.exceptions.ResourceNotFoundException;
import com.profroid.profroidapp.utils.exceptions.InvalidOperationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerRequestMapper customerRequestMapper;
    private final CustomerResponseMapper customerResponseMapper;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               CustomerRequestMapper customerRequestMapper,
                               CustomerResponseMapper customerResponseMapper) {
        this.customerRepository = customerRepository;
        this.customerRequestMapper = customerRequestMapper;
        this.customerResponseMapper = customerResponseMapper;
    }


    @Override
    public List<CustomerResponseModel> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return customerResponseMapper.toResponseModelList(customers);
    }


    @Override
    public CustomerResponseModel getCustomerById(String customerId) {

        if (customerId == null || customerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        Customer foundCustomer =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);

        if (foundCustomer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }

        return customerResponseMapper.toResponseModel(foundCustomer);
    }


    @Override
    public CustomerResponseModel getCustomerByUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new InvalidIdentifierException("User ID is required.");
        }

        Customer foundCustomer = customerRepository.findCustomerByUserId(userId);

        if (foundCustomer == null) {
            // Auto-create customer record if it doesn't exist
            // This handles the case when a user registers via auth-service
            CustomerIdentifier customerIdentifier = new CustomerIdentifier();
            Customer newCustomer = new Customer();
            newCustomer.setCustomerIdentifier(customerIdentifier);
            newCustomer.setUserId(userId);
            newCustomer.setIsActive(true);
            // Initialize with empty values - user can update later
            newCustomer.setFirstName("");
            newCustomer.setLastName("");
            // Initialize empty address
            newCustomer.setCustomerAddress(new CustomerAddress("", "", "", "", ""));
            
            foundCustomer = customerRepository.save(newCustomer);
        }

        return customerResponseMapper.toResponseModel(foundCustomer);
    }

    @Override
    public CustomerResponseModel updateCustomerByUserId(String userId, CustomerRequestModel requestModel) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new InvalidIdentifierException("User ID is required.");
        }

        Customer foundCustomer = customerRepository.findCustomerByUserId(userId);

        if (foundCustomer == null) {
            // Auto-create a customer record if missing, mirroring GET behavior
            CustomerIdentifier customerIdentifier = new CustomerIdentifier();
            Customer newCustomer = new Customer();
            newCustomer.setCustomerIdentifier(customerIdentifier);
            newCustomer.setUserId(userId);
            newCustomer.setIsActive(true);
            newCustomer.setFirstName("");
            newCustomer.setLastName("");
            newCustomer.setCustomerAddress(new CustomerAddress("", "", "", "", ""));
            foundCustomer = customerRepository.save(newCustomer);
        }

        // Update simple fields
        foundCustomer.setFirstName(requestModel.getFirstName());
        foundCustomer.setLastName(requestModel.getLastName());

        // Update address fields
        foundCustomer.getCustomerAddress().setStreetAddress(requestModel.getStreetAddress());
        foundCustomer.getCustomerAddress().setCity(requestModel.getCity());
        foundCustomer.getCustomerAddress().setProvince(requestModel.getProvince());
        foundCustomer.getCustomerAddress().setCountry(requestModel.getCountry());
        foundCustomer.getCustomerAddress().setPostalCode(requestModel.getPostalCode());

        // Update phone numbers
        foundCustomer.setPhoneNumbers(requestModel.getPhoneNumbers());

        Customer updatedCustomer = customerRepository.save(foundCustomer);
        return customerResponseMapper.toResponseModel(updatedCustomer);
    }


    @Override
    public CustomerResponseModel createCustomer(CustomerRequestModel requestModel) {

        // Enforce unique userId
        if (customerRepository.findCustomerByUserId(requestModel.getUserId()) != null) {
            throw new ResourceAlreadyExistsException(
                    "Cannot create customer: A customer already exists with user ID '" +
                            requestModel.getUserId() + "'."
            );
        }

        CustomerIdentifier customerIdentifier = new CustomerIdentifier();
        Customer customer = customerRequestMapper.toEntity(requestModel, customerIdentifier);

        customer.setIsActive(true);

        Customer savedCustomer = customerRepository.save(customer);
        return customerResponseMapper.toResponseModel(savedCustomer);
    }


    @Override
    public CustomerResponseModel updateCustomer(String customerId, CustomerRequestModel requestModel) {

        if (customerId == null || customerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        Customer existingCustomer =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);

        if (existingCustomer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }

        // Enforce unique userId (allow if it belongs to same customer)
        String newUserId = requestModel.getUserId();
        Customer userIdOwner = customerRepository.findCustomerByUserId(newUserId);

        if (userIdOwner != null &&
                !userIdOwner.getCustomerIdentifier().getCustomerId().equals(customerId)) {
            throw new ResourceAlreadyExistsException(
                    "Cannot update customer: A customer already exists with user ID '" + newUserId + "'."
            );
        }

        // Update simple fields
        existingCustomer.setFirstName(requestModel.getFirstName());
        existingCustomer.setLastName(requestModel.getLastName());

        // Update address fields
        existingCustomer.getCustomerAddress().setStreetAddress(requestModel.getStreetAddress());
        existingCustomer.getCustomerAddress().setCity(requestModel.getCity());
        existingCustomer.getCustomerAddress().setProvince(requestModel.getProvince());
        existingCustomer.getCustomerAddress().setCountry(requestModel.getCountry());
        existingCustomer.getCustomerAddress().setPostalCode(requestModel.getPostalCode());

        // Update phone numbers
        existingCustomer.setPhoneNumbers(requestModel.getPhoneNumbers());

        // Update userId
        existingCustomer.setUserId(requestModel.getUserId());

        Customer updatedCustomer = customerRepository.save(existingCustomer);
        return customerResponseMapper.toResponseModel(updatedCustomer);
    }


    @Override
    public void deleteCustomer(String customerId) {

        if (customerId == null || customerId.trim().length() != 36) {
            throw new InvalidIdentifierException("Customer ID must be a 36-character UUID string.");
        }

        Customer customer =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);

        if (customer == null) {
            throw new ResourceNotFoundException("Customer " + customerId + " not found.");
        }

        if (!customer.getIsActive()) {
            throw new InvalidOperationException("Customer " + customerId + " is already deactivated.");
        }

        customer.setIsActive(false);
        customerRepository.save(customer);
    }
}
