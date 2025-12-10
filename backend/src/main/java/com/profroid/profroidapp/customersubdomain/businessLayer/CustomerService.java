package com.profroid.profroidapp.customersubdomain.businessLayer;

import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;

import java.util.List;

public interface CustomerService {
    List<CustomerResponseModel> getAllCustomers();
    CustomerResponseModel getCustomerById(String customerId);
    CustomerResponseModel getCustomerByUserId(String userId);
    CustomerResponseModel updateCustomerByUserId(String userId, CustomerRequestModel requestModel);
    CustomerResponseModel createCustomer(CustomerRequestModel requestModel);
    CustomerResponseModel updateCustomer(String customerId, CustomerRequestModel requestModel);
    void deleteCustomer(String customerId);
}
