package com.profroid.profroidapp.PartTesting.partPresentationLayer;

import com.profroid.profroidapp.config.TestSecurityConfig;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartRequestModel;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@AutoConfigureWebTestClient
@SpringBootTest(webEnvironment = RANDOM_PORT)
public class PartControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private PartRepository partRepository;

    private Part testPart;
    private String testPartId;


    @BeforeEach
    void setup() {
        partRepository.deleteAll();

        testPartId = SkuGenerator.generateSku();

        testPart = new Part();
        testPart.setPartIdentifier(new PartIdentifier(testPartId));
        testPart.setName("Cooling Fan");
        testPart.setCategory("Cooling");
        testPart.setQuantity(15);
        testPart.setPrice(java.math.BigDecimal.valueOf(42.50));
        testPart.setSupplier("Acme Supplies");
        testPart.setAvailable(true);

        partRepository.save(testPart);
    }

    @AfterEach
    void cleanup() {
        partRepository.deleteAll();
    }



    @Test
    void whenGetAllParts_thenReturnList() {
        webTestClient.get()
                .uri("/api/v1/parts")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(PartResponseModel.class)
                .value(parts -> {
                    assertNotNull(parts);
                    assertEquals(1, parts.size());
                    assertEquals("Cooling Fan", parts.get(0).getName());
                });
    }

    @Test
    void whenGetAllParts_withNoData_thenReturnEmptyList() {
        partRepository.deleteAll();

        webTestClient.get()
                .uri("/api/v1/parts")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(PartResponseModel.class)
                .value(parts -> assertTrue(parts.isEmpty()));
    }



    @Test
    void whenGetPartById_withValidId_thenReturnPart() {
        webTestClient.get()
                .uri("/api/v1/parts/{partId}", testPartId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(PartResponseModel.class)
                .value(part -> {
                    assertNotNull(part);
                    assertEquals(testPartId, part.getPartId());
                    assertEquals("Cooling Fan", part.getName());
                });
    }



    @Test
    void whenGetPartById_withNonExistingId_thenReturn404() {
        webTestClient.get()
                .uri("/api/v1/parts/{partId}", "PC-999999")
                .exchange()
                .expectStatus().isNotFound();
    }



    @Test
    void whenCreatePart_withValidData_thenReturn201() {
        PartRequestModel request = PartRequestModel.builder()
                .name("Heater Module")
            .category("Heating")
            .quantity(8)
            .price(java.math.BigDecimal.valueOf(55.75))
            .supplier("Global Parts")
            .available(true)
                .build();

        webTestClient.post()
                .uri("/api/v1/parts")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(PartResponseModel.class)
                .value(response -> {
                    assertEquals("Heater Module", response.getName());
                    assertTrue(response.getAvailable());
                });

        assertEquals(2, partRepository.findAll().size());
    }

    @Test
    void whenCreatePart_withDuplicateName_thenReturn409() {
        PartRequestModel request = PartRequestModel.builder()
                .name("Cooling Fan") // duplicate
            .category("Cooling")
            .quantity(10)
            .price(java.math.BigDecimal.valueOf(42.50))
            .supplier("Acme Supplies")
            .available(true)
                .build();

        webTestClient.post()
                .uri("/api/v1/parts")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .exchange()
                .expectStatus().isEqualTo(409);

        assertEquals(1, partRepository.findAll().size());
    }



    @Test
    void whenUpdatePart_withValidData_thenReturnUpdated() {
        PartRequestModel updateRequest = PartRequestModel.builder()
                .name("Updated Cooling Fan")
            .category("Cooling")
            .quantity(5)
            .price(java.math.BigDecimal.valueOf(40.00))
            .supplier("Acme Supplies")
            .available(false)
                .build();

        webTestClient.put()
                .uri("/api/v1/parts/{partId}", testPartId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody(PartResponseModel.class)
                .value(updated -> {
                    assertEquals("Updated Cooling Fan", updated.getName());
                    assertFalse(updated.getAvailable());
                });
    }



    @Test
    void whenUpdatePart_withNonExistingId_thenReturn404() {
        PartRequestModel updateRequest = PartRequestModel.builder()
                .name("Fan Y")
            .category("Cooling")
            .quantity(7)
            .price(java.math.BigDecimal.valueOf(10.00))
            .supplier("Acme Supplies")
            .available(true)
                .build();

        webTestClient.put()
                .uri("/api/v1/parts/{partId}", "PC-999999")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(updateRequest)
                .exchange()
                .expectStatus().isNotFound();
    }


    @Test
    void whenDeletePart_withValidId_thenReturn204() {
        webTestClient.delete()
                .uri("/api/v1/parts/{partId}", testPartId)
                .exchange()
                .expectStatus().isNoContent();

        Part deleted = partRepository.findPartByPartIdentifier_PartId(testPartId);

        assertNotNull(deleted);
        assertFalse(deleted.getAvailable());
    }



    @Test
    void whenDeletePart_withNonExistingId_thenReturn404() {
        webTestClient.delete()
                .uri("/api/v1/parts/{partId}", "PC-999999")
                .exchange()
                .expectStatus().isNotFound();
    }
}
