package com.profroid.profroidapp.CustomerTesting.customerDataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class CustomerRepositoryIntegrationTest {

    @Autowired
    private CustomerRepository customerRepository;

    private Customer buildCustomer(String userId) {

        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.MOBILE);
        phone.setNumber("438-555-1234");

        CustomerAddress address = CustomerAddress.builder()
                .streetAddress("456 Elm Street")
                .city("Montreal")
                .province("QC")
                .country("Canada")
                .postalCode("H2B 2B2")
                .build();

        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier());
        customer.setFirstName("Alice");
        customer.setLastName("Martin");
        customer.setUserId(userId);
        customer.setPhoneNumbers(Arrays.asList(phone));
        customer.setCustomerAddress(address);
        customer.setIsActive(true);

        return customer;
    }

    // -------------------------------------------------------------------------
    // FIND BY USER ID
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCustomer_thenCanFindByUserId() {
        Customer saved = customerRepository.save(buildCustomer("alicemartin"));
        assertNotNull(saved.getId());

        Customer found = customerRepository.findCustomerByUserId("alicemartin");

        assertNotNull(found);
        assertEquals("alicemartin", found.getUserId());
    }

    // -------------------------------------------------------------------------
    // FIND BY CUSTOMER IDENTIFIER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCustomer_thenCanFindByCustomerIdentifier() {
        Customer saved = customerRepository.save(buildCustomer("marcdubois"));

        String customerId = saved.getCustomerIdentifier().getCustomerId();
        assertNotNull(customerId);

        Customer found =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(customerId);

        assertNotNull(found);
        assertEquals(customerId, found.getCustomerIdentifier().getCustomerId());
    }
}
