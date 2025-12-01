package com.profroid.profroidapp.customersubdomain.businessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerRequestMapper;
import com.profroid.profroidapp.customersubdomain.mappingLayer.CustomerResponseMapper;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerRequestMapper customerRequestMapper;
    private final CustomerResponseMapper customerResponseMapper;

    public CustomerServiceImpl(CustomerRepository customerRepository, CustomerRequestMapper customerRequestMapper, CustomerResponseMapper customerResponseMapper) {
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
        Customer foundCustomer = customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);

        if (foundCustomer == null) {
            throw new EntityNotFoundException("Customer not found: " + customerId);
        }

        return customerResponseMapper.toResponseModel(foundCustomer);
    }

    @Override
    public CustomerResponseModel createCustomer(CustomerRequestModel requestModel) {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier();
        Customer customer = customerRequestMapper.toEntity(requestModel, customerIdentifier);
        Customer savedCustomer = customerRepository.save(customer);
        return customerResponseMapper.toResponseModel(savedCustomer);
    }

    @Override
    public CustomerResponseModel updateCustomer(String customerId, CustomerRequestModel requestModel) {

        // 1. Retrieve existing customer
        Customer existingCustomer = customerRepository
                .findCustomerByCustomerIdentifier_CustomerId(customerId);

        if (existingCustomer == null) {
            throw new EntityNotFoundException("Customer not found: " + customerId);
        }

        // 2. Update simple fields
        existingCustomer.setFirstName(requestModel.getFirstName());
        existingCustomer.setLastName(requestModel.getLastName());

        // 3. Update address
        existingCustomer.getCustomerAddress().setStreetAddress(requestModel.getStreetAddress());
        existingCustomer.getCustomerAddress().setCity(requestModel.getCity());
        existingCustomer.getCustomerAddress().setProvince(requestModel.getProvince());
        existingCustomer.getCustomerAddress().setCountry(requestModel.getCountry());
        existingCustomer.getCustomerAddress().setPostalCode(requestModel.getPostalCode());

        // 4. Update phone numbers
        existingCustomer.setPhoneNumbers(requestModel.getPhoneNumbers());

        // 5. Update userId
        existingCustomer.setUserId(requestModel.getUserId());

        // 6. Save
        Customer updatedCustomer = customerRepository.save(existingCustomer);

        // 7. Return response
        return customerResponseMapper.toResponseModel(updatedCustomer);
    }

    @Override
    public void deleteCustomer(String customerId) {

    }
}
