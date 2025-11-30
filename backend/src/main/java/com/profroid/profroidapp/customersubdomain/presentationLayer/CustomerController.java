package com.profroid.profroidapp.customersubdomain.presentationLayer;

import com.profroid.profroidapp.customersubdomain.businessLayer.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponseModel>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponseModel> getCustomerById(@PathVariable String customerId) {
        return ResponseEntity.ok(customerService.getCustomerById(customerId));
    }

    @PostMapping
    public ResponseEntity<CustomerResponseModel> createCustomer( @Valid @RequestBody CustomerRequestModel requestModel) {
        CustomerResponseModel createdCustomer = customerService.createCustomer(requestModel);
        return ResponseEntity.ok(createdCustomer);
    }
}
