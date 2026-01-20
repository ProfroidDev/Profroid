package com.profroid.profroidapp.customersubdomain.presentationLayer;

import com.profroid.profroidapp.cellarsubdomain.businessLayer.CellarService;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.businessLayer.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CellarService cellarService;

    public CustomerController(CustomerService customerService, CellarService cellarService) {
        this.customerService = customerService;
        this.cellarService = cellarService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponseModel>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponseModel> getCustomerById(@PathVariable String customerId) {
        return ResponseEntity.ok(customerService.getCustomerById(customerId));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<CustomerResponseModel> getCustomerByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(customerService.getCustomerByUserId(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/by-user/{userId}")
    public ResponseEntity<CustomerResponseModel> updateCustomerByUserId(@PathVariable String userId,
                                                                        @Valid @RequestBody CustomerRequestModel requestModel) {
        CustomerResponseModel updatedCustomer = customerService.updateCustomerByUserId(userId, requestModel);
        return ResponseEntity.ok(updatedCustomer);
    }

    
    @PostMapping
    public ResponseEntity<CustomerResponseModel> createCustomer( @Valid @RequestBody CustomerRequestModel requestModel) {
        CustomerResponseModel createdCustomer = customerService.createCustomer(requestModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomer);
    }



    ///Cellars////
    @GetMapping("/{customerId}/cellars")
    public ResponseEntity<List<CellarResponseModel>> getAllCellars(
            @PathVariable String customerId) {

        List<CellarResponseModel> responseModels =
                cellarService.getAllCellars(customerId);

        return ResponseEntity.ok(responseModels);
    }

    @GetMapping("/{customerId}/cellars/{cellarId}")
    public ResponseEntity<CellarResponseModel> getCellarById(
            @PathVariable String customerId,
            @PathVariable String cellarId) {

        CellarResponseModel responseModel =
                cellarService.getCellarById(customerId, cellarId);

        return ResponseEntity.ok(responseModel);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{customerId}")
    public ResponseEntity<CustomerResponseModel> updateCustomer(@PathVariable String customerId,
                                                                @Valid @RequestBody CustomerRequestModel requestModel) {
        CustomerResponseModel updatedCustomer = customerService.updateCustomer(customerId, requestModel);
        return ResponseEntity.ok(updatedCustomer);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String customerId) {
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }
}
