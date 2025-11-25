package com.profroid.profroidapp.customersubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Customer findCustomerByCustomerIdentifier_CustomerId(String customerIdentifier);
}
