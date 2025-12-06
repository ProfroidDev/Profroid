package com.profroid.profroidapp.CustomerTesting.customerPresentationLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.*;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.*;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerRequestModel;
import com.profroid.profroidapp.customersubdomain.presentationLayer.CustomerResponseModel;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootTest(webEnvironment = RANDOM_PORT)
public class CustomerControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CellarRepository cellarRepository;

    private Customer testCustomer;
    private String testCustomerId;

    @BeforeEach
    void setup() {
        cellarRepository.deleteAll();
        customerRepository.deleteAll();

        // Build base test customer
        testCustomer = new Customer();
        testCustomer.setCustomerIdentifier(new CustomerIdentifier());
        testCustomer.setFirstName("John");
        testCustomer.setLastName("Doe");
        testCustomer.setUserId("johndoe");
        testCustomer.setIsActive(true);

        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.MOBILE);
        phone.setNumber("438-555-1111");
        testCustomer.setPhoneNumbers(Collections.singletonList(phone));

        CustomerAddress address = CustomerAddress.builder()
                .streetAddress("123 Apple St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1A 1A1")
                .build();
        testCustomer.setCustomerAddress(address);

        Customer saved = customerRepository.save(testCustomer);
        testCustomerId = saved.getCustomerIdentifier().getCustomerId();
    }

    @AfterEach
    void cleanup() {
        cellarRepository.deleteAll();
        customerRepository.deleteAll();
    }

    // ================================================================
    // GET ALL CUSTOMERS
    // ================================================================
    @Test
    void whenGetAllCustomers_thenReturnsList() {
        webTestClient.get()
                .uri("/api/v1/customers")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(CustomerResponseModel.class)
                .value(customers -> {
                    assertNotNull(customers);
                    assertEquals(1, customers.size());
                    assertEquals("John", customers.get(0).getFirstName());
                });
    }

    @Test
    void whenGetAllCustomers_withNoData_thenReturnsEmptyList() {
        customerRepository.deleteAll();

        webTestClient.get()
                .uri("/api/v1/customers")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(CustomerResponseModel.class)
                .value(customers -> assertTrue(customers.isEmpty()));
    }

    // ================================================================
    // GET CUSTOMER BY ID
    // ================================================================
    @Test
    void whenGetCustomerById_withValidId_thenReturnsCustomer() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}", testCustomerId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(CustomerResponseModel.class)
                .value(customer -> {
                    assertNotNull(customer);
                    assertEquals(testCustomerId, customer.getCustomerId().getCustomerId());
                    assertEquals("johndoe", customer.getUserId());
                });
    }

    @Test
    void whenGetCustomerById_withInvalidId_thenReturns422() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetCustomerById_withNonExistingId_thenReturns404() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}",
                        "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // CREATE CUSTOMER
    // ================================================================
    @Test
    void whenCreateCustomer_withValidData_thenReturns201() {
        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.HOME);
        phone.setNumber("438-555-2222");

        CustomerRequestModel request = CustomerRequestModel.builder()
                .firstName("Alice")
                .lastName("Martin")
                .userId("alicemartin")
                .streetAddress("45 Sherbrooke")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3B 1B1")
                .phoneNumbers(Collections.singletonList(phone))
                .build();

        webTestClient.post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(CustomerResponseModel.class)
                .value(customer -> assertEquals("Alice", customer.getFirstName()));

        assertEquals(2, customerRepository.findAll().size());
    }

    @Test
    void whenCreateCustomer_withDuplicateUserId_thenReturns409() {
        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.HOME);
        phone.setNumber("438-555-2222");

        CustomerRequestModel request = CustomerRequestModel.builder()
                .firstName("Alice")
                .lastName("Martin")
                .userId("johndoe") // duplicate
                .streetAddress("45 Sherbrooke")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3B 1B1")
                .phoneNumbers(Collections.singletonList(phone))
                .build();

        webTestClient.post()
                .uri("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(409);

        assertEquals(1, customerRepository.findAll().size());
    }

    // ================================================================
    // UPDATE CUSTOMER
    // ================================================================
    @Test
    void whenUpdateCustomer_withValidData_thenReturnsUpdated() {
        CustomerPhoneNumber phone = new CustomerPhoneNumber();
        phone.setType(PhoneType.WORK);
        phone.setNumber("438-555-3333");

        CustomerRequestModel request = CustomerRequestModel.builder()
                .firstName("Johnny")
                .lastName("Doe")
                .userId("johnupdated")
                .streetAddress("987 Rue Pine")
                .city("Laval")
                .province("Quebec")
                .country("Canada")
                .postalCode("H3C 1A2")
                .phoneNumbers(Collections.singletonList(phone))
                .build();

        webTestClient.put()
                .uri("/api/v1/customers/{customerId}", testCustomerId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isOk();

        Customer updated =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(testCustomerId);

        assertEquals("Johnny", updated.getFirstName());
        assertEquals("johnupdated", updated.getUserId());
    }

    @Test
    void whenUpdateCustomer_withInvalidId_thenReturns422() {
        CustomerRequestModel request = CustomerRequestModel.builder()
                .firstName("Invalid")
                .build();

        webTestClient.put()
                .uri("/api/v1/customers/{customerId}", "bad-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenUpdateCustomer_withNonExistingId_thenReturns404() {
        CustomerRequestModel request = CustomerRequestModel.builder()
                .firstName("Invalid")
                .build();

        webTestClient.put()
                .uri("/api/v1/customers/{customerId}",
                        "00000000-0000-0000-0000-000000000000")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // DELETE CUSTOMER
    // ================================================================
    @Test
    void whenDeleteCustomer_withValidId_thenReturns204() {
        webTestClient.delete()
                .uri("/api/v1/customers/{customerId}", testCustomerId)
                .exchange()
                .expectStatus().isNoContent();

        Customer deleted =
                customerRepository.findCustomerByCustomerIdentifier_CustomerId(testCustomerId);

        assertFalse(deleted.getIsActive());
    }

    @Test
    void whenDeleteCustomer_withInvalidId_thenReturns422() {
        webTestClient.delete()
                .uri("/api/v1/customers/{customerId}", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenDeleteCustomer_withNonExistingId_thenReturns404() {
        webTestClient.delete()
                .uri("/api/v1/customers/{customerId}",
                        "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // CELLAR TEST HELPERS
    // ================================================================

    private Customer buildCustomer(String userId) {
        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier());
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setUserId(userId);
        customer.setIsActive(true);

        customer.setCustomerAddress(
                CustomerAddress.builder()
                        .streetAddress("123 Main St")
                        .city("Montreal")
                        .province("QC")
                        .country("Canada")
                        .postalCode("H1H1H1")
                        .build()
        );

        return customer;
    }

    private Cellar buildCellar(Customer owner, String name, int capacity) {
        Cellar cellar = new Cellar();
        cellar.setCellarIdentifier(new CellarIdentifier());
        cellar.setOwnerCustomer(owner);
        cellar.setOwnerCustomerIdentifier(owner.getCustomerIdentifier());
        cellar.setName(name);
        cellar.setHeight(80);
        cellar.setWidth(50);
        cellar.setDepth(60);
        cellar.setBottleCapacity(capacity);
        cellar.setCellarType(CellarType.PRIVATE);
        cellar.setHasCoolingSystem(true);
        cellar.setHasAutoRegulation(true);
        cellar.setHasHumidityControl(true);
        return cellar;
    }

    // ================================================================
    // GET /customers/{id}/cellars
    // ================================================================
    @Test
    void whenGetAllCellars_withValidCustomerId_thenReturnCellarList() {
        Customer savedCustomer = customerRepository.save(buildCustomer("user123"));

        cellarRepository.save(buildCellar(savedCustomer, "Wine Room", 120));
        cellarRepository.save(buildCellar(savedCustomer, "Basement Cellar", 80));

        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars",
                        savedCustomer.getCustomerIdentifier().getCustomerId())
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(CellarResponseModel.class)
                .hasSize(2);
    }

    @Test
    void whenGetAllCellars_withInvalidCustomerId_thenReturn422() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars", "invalid-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetAllCellars_withNonExistingCustomerId_thenReturn404() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars",
                        "123e4567-e89b-12d3-a456-426614174999")
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // GET /customers/{id}/cellars/{cellarId}
    // ================================================================
    @Test
    void whenGetCellarById_withValidIds_thenReturnCellar() {
        Customer customer = customerRepository.save(buildCustomer("userABC"));
        Cellar cellar = cellarRepository.save(buildCellar(customer, "Premium Cellar", 200));

        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars/{cellarId}",
                        customer.getCustomerIdentifier().getCustomerId(),
                        cellar.getCellarIdentifier().getCellarId())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.cellarId").isEqualTo(cellar.getCellarIdentifier().getCellarId())
                .jsonPath("$.name").isEqualTo("Premium Cellar");
    }

    @Test
    void whenGetCellarById_withInvalidCustomerId_thenReturn422() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars/{cellarId}",
                        "invalid", "cellar-123")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetCellarById_withInvalidCellarId_thenReturn422() {
        Customer customer = customerRepository.save(buildCustomer("customerX"));

        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars/{cellarId}",
                        customer.getCustomerIdentifier().getCustomerId(),
                        "invalid-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetCellarById_withNonExistingCellarId_thenReturn404() {
        Customer customer = customerRepository.save(buildCustomer("userAAA"));

        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars/{cellarId}",
                        customer.getCustomerIdentifier().getCustomerId(),
                        "123e4567-e89b-12d3-a456-426614174999")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void whenGetCellarById_withNonExistingCustomerId_thenReturn404() {
        webTestClient.get()
                .uri("/api/v1/customers/{customerId}/cellars/{cellarId}",
                        "123e4567-e89b-12d3-a456-426614170000",
                        "123e4567-e89b-12d3-a456-426614179999")
                .exchange()
                .expectStatus().isNotFound();
    }
}
