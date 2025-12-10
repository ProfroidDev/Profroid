package com.profroid.profroidapp.CellarTesting.cellarPresentationLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarRequestModel;
import com.profroid.profroidapp.cellarsubdomain.presentationLayer.CellarResponseModel;
import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = RANDOM_PORT)
public class CellarControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private CellarRepository cellarRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private Cellar testCellar;
    private String testCellarId;
    private Customer testCustomer;
    private String testCustomerId;

    @BeforeEach
    void setup() {
        cellarRepository.deleteAll();
        customerRepository.deleteAll();

        // Create test customer first
        testCustomer = new Customer();
        testCustomer.setCustomerIdentifier(new CustomerIdentifier());
        testCustomer.setFirstName("John");
        testCustomer.setLastName("Doe");
        testCustomer.setUserId("johndoe");
        testCustomer.setIsActive(true);
        testCustomer.setPhoneNumbers(Collections.emptyList());

        CustomerAddress address = CustomerAddress.builder()
                .streetAddress("123 Test St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1A 1A1")
                .build();
        testCustomer.setCustomerAddress(address);

        Customer savedCustomer = customerRepository.save(testCustomer);
        testCustomerId = savedCustomer.getCustomerIdentifier().getCustomerId();

        // Build base test cellar
        testCellar = new Cellar();
        testCellar.setCellarIdentifier(new CellarIdentifier());
        testCellar.setOwnerCustomerIdentifier(savedCustomer.getCustomerIdentifier());
        testCellar.setName("Wine Cellar");
        testCellar.setHeight(2.5);
        testCellar.setWidth(3.0);
        testCellar.setDepth(2.0);
        testCellar.setBottleCapacity(150);
        testCellar.setHasCoolingSystem(true);
        testCellar.setHasHumidityControl(true);
        testCellar.setHasAutoRegulation(false);
        testCellar.setCellarType(CellarType.PRIVATE);
        testCellar.setIsActive(true);

        Cellar saved = cellarRepository.save(testCellar);
        testCellarId = saved.getCellarIdentifier().getCellarId();
    }

    @AfterEach
    void cleanup() {
        cellarRepository.deleteAll();
        customerRepository.deleteAll();
    }

    // ================================================================
    // GET ALL CELLARS
    // ================================================================
    @Test
    void whenGetAllCellars_thenReturnsList() {
        webTestClient.get()
                .uri("/api/v1/cellars")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBodyList(CellarResponseModel.class)
                .value(cellars -> {
                    assertNotNull(cellars);
                    assertEquals(1, cellars.size());
                    assertEquals("Wine Cellar", cellars.get(0).getName());
                });
    }

    @Test
    void whenGetAllCellars_withNoData_thenReturnsEmptyList() {
        cellarRepository.deleteAll();

        webTestClient.get()
                .uri("/api/v1/cellars")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(CellarResponseModel.class)
                .value(cellars -> assertTrue(cellars.isEmpty()));
    }

    // ================================================================
    // GET CELLAR BY ID
    // ================================================================
    @Test
    void whenGetCellarById_withValidId_thenReturnsCellar() {
        webTestClient.get()
                .uri("/api/v1/cellars/{cellarId}", testCellarId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertNotNull(cellar);
                    assertEquals(testCellarId, cellar.getCellarId());
                    assertEquals("Wine Cellar", cellar.getName());
                    assertEquals(150, cellar.getBottleCapacity());
                });
    }

    @Test
    void whenGetCellarById_withInvalidId_thenReturns422() {
        webTestClient.get()
                .uri("/api/v1/cellars/{cellarId}", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenGetCellarById_withNonExistingId_thenReturns404() {
        webTestClient.get()
                .uri("/api/v1/cellars/{cellarId}",
                        "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // CREATE CELLAR
    // ================================================================
    @Test
    void whenCreateCellar_withValidData_thenReturns201() {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier(testCustomerId);

        CellarRequestModel request = new CellarRequestModel();
        request.setOwnerCustomerId(customerIdentifier);
        request.setName("Commercial Cellar");
        request.setHeight(3.0);
        request.setWidth(4.0);
        request.setDepth(3.0);
        request.setBottleCapacity(500);
        request.setHasCoolingSystem(true);
        request.setHasHumidityControl(true);
        request.setHasAutoRegulation(true);
        request.setCellarType(CellarType.COMMERCIAL);

        webTestClient.post()
                .uri("/api/v1/cellars")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertNotNull(cellar);
                    assertNotNull(cellar.getCellarId());
                    assertEquals("Commercial Cellar", cellar.getName());
                    assertEquals(500, cellar.getBottleCapacity());
                    assertEquals(CellarType.COMMERCIAL, cellar.getCellarType());
                });
    }

    @Test
    void whenCreateCellar_withDifferentCellarTypes_thenReturns201() {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier(testCustomerId);

        CellarRequestModel modularRequest = new CellarRequestModel();
        modularRequest.setOwnerCustomerId(customerIdentifier);
        modularRequest.setName("Modular Cellar");
        modularRequest.setHeight(2.0);
        modularRequest.setWidth(2.0);
        modularRequest.setDepth(2.0);
        modularRequest.setBottleCapacity(50);
        modularRequest.setHasCoolingSystem(false);
        modularRequest.setHasHumidityControl(false);
        modularRequest.setHasAutoRegulation(false);
        modularRequest.setCellarType(CellarType.MODULAR);

        webTestClient.post()
                .uri("/api/v1/cellars")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(modularRequest)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertEquals(CellarType.MODULAR, cellar.getCellarType());
                    assertEquals(50, cellar.getBottleCapacity());
                });
    }

    // ================================================================
    // UPDATE CELLAR
    // ================================================================
    @Test
    void whenUpdateCellar_withValidData_thenReturns200() {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier(testCustomerId);

        CellarRequestModel updateRequest = new CellarRequestModel();
        updateRequest.setOwnerCustomerId(customerIdentifier);
        updateRequest.setName("Updated Cellar");
        updateRequest.setHeight(3.0);
        updateRequest.setWidth(3.5);
        updateRequest.setDepth(2.5);
        updateRequest.setBottleCapacity(200);
        updateRequest.setHasCoolingSystem(true);
        updateRequest.setHasHumidityControl(true);
        updateRequest.setHasAutoRegulation(true);
        updateRequest.setCellarType(CellarType.PRIVATE);

        webTestClient.put()
                .uri("/api/v1/cellars/{cellarId}", testCellarId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertEquals(testCellarId, cellar.getCellarId());
                    assertEquals("Updated Cellar", cellar.getName());
                    assertEquals(200, cellar.getBottleCapacity());
                });
    }

    @Test
    void whenUpdateCellar_withInvalidId_thenReturns422() {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier(testCustomerId);

        CellarRequestModel updateRequest = new CellarRequestModel();
        updateRequest.setOwnerCustomerId(customerIdentifier);
        updateRequest.setName("Updated Cellar");
        updateRequest.setHeight(3.0);
        updateRequest.setWidth(3.5);
        updateRequest.setDepth(2.5);
        updateRequest.setBottleCapacity(200);
        updateRequest.setHasCoolingSystem(true);
        updateRequest.setHasHumidityControl(true);
        updateRequest.setHasAutoRegulation(true);
        updateRequest.setCellarType(CellarType.PRIVATE);

        webTestClient.put()
                .uri("/api/v1/cellars/{cellarId}", "bad-id")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenUpdateCellar_withNonExistingId_thenReturns404() {
        CustomerIdentifier customerIdentifier = new CustomerIdentifier(testCustomerId);

        CellarRequestModel updateRequest = new CellarRequestModel();
        updateRequest.setOwnerCustomerId(customerIdentifier);
        updateRequest.setName("Updated Cellar");
        updateRequest.setHeight(3.0);
        updateRequest.setWidth(3.5);
        updateRequest.setDepth(2.5);
        updateRequest.setBottleCapacity(200);
        updateRequest.setHasCoolingSystem(true);
        updateRequest.setHasHumidityControl(true);
        updateRequest.setHasAutoRegulation(true);
        updateRequest.setCellarType(CellarType.PRIVATE);

        webTestClient.put()
                .uri("/api/v1/cellars/{cellarId}", "00000000-0000-0000-0000-000000000000")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isNotFound();
    }

    // ================================================================
    // DEACTIVATE CELLAR
    // ================================================================
    @Test
    void whenDeactivateCellar_withValidId_thenReturns200AndCellarIsDeactivated() {
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", testCellarId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertEquals(testCellarId, cellar.getCellarId());
                    // Verify deactivated through response
                    assertNotNull(cellar);
                });

        // Verify in database
        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(testCellarId);
        assertNotNull(found);
        assertFalse(found.getIsActive());
    }

    @Test
    void whenDeactivateCellar_withInvalidId_thenReturns422() {
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenDeactivateCellar_withNonExistingId_thenReturns404() {
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void whenDeactivateCellar_alreadyDeactivated_thenReturns400() {
        // First deactivate – should succeed
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", testCellarId)
                .exchange()
                .expectStatus().isOk();

        // Try to deactivate again – currently returns 400 in your app
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", testCellarId)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody(String.class)
                .value(body -> assertTrue(
                        body.contains("already deactivated"),
                        "Error message should indicate cellar is already deactivated"
                ));
    }

    // ================================================================
    // REACTIVATE CELLAR
    // ================================================================
    @Test
    void whenReactivateCellar_withValidId_thenReturns200AndCellarIsReactivated() {
        // First deactivate
        webTestClient.delete()
                .uri("/api/v1/cellars/{cellarId}/deactivate", testCellarId)
                .exchange()
                .expectStatus().isOk();

        // Then reactivate
        webTestClient.patch()
                .uri("/api/v1/cellars/{cellarId}/reactivate", testCellarId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(CellarResponseModel.class)
                .value(cellar -> {
                    assertEquals(testCellarId, cellar.getCellarId());
                    // Verify reactivated
                    assertNotNull(cellar);
                });

        // Verify in database
        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(testCellarId);
        assertNotNull(found);
        assertTrue(found.getIsActive());
    }

    @Test
    void whenReactivateCellar_withInvalidId_thenReturns422() {
        webTestClient.patch()
                .uri("/api/v1/cellars/{cellarId}/reactivate", "bad-id")
                .exchange()
                .expectStatus().isEqualTo(422);
    }

    @Test
    void whenReactivateCellar_withNonExistingId_thenReturns404() {
        webTestClient.patch()
                .uri("/api/v1/cellars/{cellarId}/reactivate", "00000000-0000-0000-0000-000000000000")
                .exchange()
                .expectStatus().isNotFound();
    }
    @Test
    void whenReactivateCellar_alreadyActive_thenReturns400() {
        webTestClient.patch()
                .uri("/api/v1/cellars/{cellarId}/reactivate", testCellarId)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody(String.class)
                .value(body -> assertTrue(body.contains("already active")));
    }

}
