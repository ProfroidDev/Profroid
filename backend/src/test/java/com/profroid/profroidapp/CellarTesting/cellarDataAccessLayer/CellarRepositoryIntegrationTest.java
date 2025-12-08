package com.profroid.profroidapp.CellarTesting.cellarDataAccessLayer;

import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.Cellar;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarIdentifier;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarRepository;
import com.profroid.profroidapp.cellarsubdomain.dataAccessLayer.CellarType;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.Customer;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerAddress;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class CellarRepositoryIntegrationTest {

    @Autowired
    private CellarRepository cellarRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private Customer createTestCustomer(String userId) {
        Customer customer = new Customer();
        customer.setCustomerIdentifier(new CustomerIdentifier());
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setUserId(userId);
        customer.setIsActive(true);
        customer.setPhoneNumbers(Collections.emptyList());

        CustomerAddress address = CustomerAddress.builder()
                .streetAddress("123 Test St")
                .city("Montreal")
                .province("Quebec")
                .country("Canada")
                .postalCode("H1A 1A1")
                .build();
        customer.setCustomerAddress(address);

        return customerRepository.save(customer);
    }

    private Cellar buildCellar(CustomerIdentifier ownerCustomerId, String name, CellarType type) {
        Cellar cellar = new Cellar();
        cellar.setCellarIdentifier(new CellarIdentifier());
        cellar.setOwnerCustomerIdentifier(ownerCustomerId);
        cellar.setName(name);
        cellar.setHeight(2.5);
        cellar.setWidth(3.0);
        cellar.setDepth(2.0);
        cellar.setBottleCapacity(150);
        cellar.setHasCoolingSystem(true);
        cellar.setHasHumidityControl(true);
        cellar.setHasAutoRegulation(false);
        cellar.setCellarType(type);
        cellar.setIsActive(true);
        return cellar;
    }

    // -------------------------------------------------------------------------
    // FIND BY CELLAR IDENTIFIER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCellar_thenCanFindByCellarIdentifier() {
        Customer customer = createTestCustomer("johndoe");
        Cellar saved = cellarRepository.save(
                buildCellar(customer.getCustomerIdentifier(), "Wine Cellar", CellarType.PRIVATE));
        assertNotNull(saved.getId());

        String cellarId = saved.getCellarIdentifier().getCellarId();
        assertNotNull(cellarId);

        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);

        assertNotNull(found);
        assertEquals(cellarId, found.getCellarIdentifier().getCellarId());
        assertEquals("Wine Cellar", found.getName());
    }

    // -------------------------------------------------------------------------
    // FIND BY OWNER CUSTOMER IDENTIFIER
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCellars_thenCanFindByOwnerCustomerIdentifier() {
        Customer customer = createTestCustomer("johndoe");
        CustomerIdentifier customerId = customer.getCustomerIdentifier();

        Cellar cellar1 = buildCellar(customerId, "Wine Cellar", CellarType.PRIVATE);
        Cellar cellar2 = buildCellar(customerId, "Commercial Cellar", CellarType.COMMERCIAL);

        cellarRepository.save(cellar1);
        cellarRepository.save(cellar2);

        List<Cellar> found = cellarRepository.findByOwnerCustomerIdentifier(customerId);

        assertNotNull(found);
        assertEquals(2, found.size());
    }

    // -------------------------------------------------------------------------
    // SAVE AND RETRIEVE
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCellar_thenAllFieldsArePersisted() {
        Customer customer = createTestCustomer("alicemartin");
        Cellar cellar = buildCellar(customer.getCustomerIdentifier(),
                "Professional Cellar", CellarType.PROFESSIONAL);
        cellar.setHeight(3.0);
        cellar.setWidth(4.0);
        cellar.setDepth(3.0);
        cellar.setBottleCapacity(500);
        cellar.setHasCoolingSystem(true);
        cellar.setHasHumidityControl(true);
        cellar.setHasAutoRegulation(true);

        Cellar saved = cellarRepository.save(cellar);
        assertNotNull(saved.getId());

        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(
                saved.getCellarIdentifier().getCellarId());

        assertNotNull(found);
        assertEquals("Professional Cellar", found.getName());
        assertEquals(3.0, found.getHeight());
        assertEquals(4.0, found.getWidth());
        assertEquals(3.0, found.getDepth());
        assertEquals(500, found.getBottleCapacity());
        assertTrue(found.isHasCoolingSystem());
        assertTrue(found.isHasHumidityControl());
        assertTrue(found.isHasAutoRegulation());
        assertEquals(CellarType.PROFESSIONAL, found.getCellarType());
    }

    // -------------------------------------------------------------------------
    // DIFFERENT CELLAR TYPES
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCellars_withDifferentTypes_thenAllArePersisted() {
        Customer customer = createTestCustomer("testuser");
        CustomerIdentifier customerId = customer.getCustomerIdentifier();

        Cellar privateCellar = buildCellar(customerId, "Private Cellar", CellarType.PRIVATE);
        Cellar commercialCellar = buildCellar(customerId, "Commercial Cellar", CellarType.COMMERCIAL);
        Cellar professionalCellar = buildCellar(customerId, "Professional Cellar", CellarType.PROFESSIONAL);
        Cellar modularCellar = buildCellar(customerId, "Modular Cellar", CellarType.MODULAR);

        cellarRepository.save(privateCellar);
        cellarRepository.save(commercialCellar);
        cellarRepository.save(professionalCellar);
        cellarRepository.save(modularCellar);

        long count = cellarRepository.count();
        assertEquals(4, count);
    }

    // -------------------------------------------------------------------------
    // UPDATE CELLAR
    // -------------------------------------------------------------------------
    @Test
    void whenUpdateCellar_thenChangesArePersisted() {
        Customer customer = createTestCustomer("updatetest");
        Cellar saved = cellarRepository.save(
                buildCellar(customer.getCustomerIdentifier(), "Original Name", CellarType.PRIVATE));
        String cellarId = saved.getCellarIdentifier().getCellarId();

        saved.setName("Updated Name");
        saved.setBottleCapacity(300);
        saved.setIsActive(false);
        cellarRepository.save(saved);

        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);
        assertNotNull(found);
        assertEquals("Updated Name", found.getName());
        assertEquals(300, found.getBottleCapacity());
        assertFalse(found.getIsActive());
    }

    // -------------------------------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------------------------------
    @Test
    void whenDeactivateCellar_thenIsActiveIsFalse() {
        Customer customer = createTestCustomer("activetest");
        Cellar saved = cellarRepository.save(
                buildCellar(customer.getCustomerIdentifier(), "Test Cellar", CellarType.PRIVATE));
        String cellarId = saved.getCellarIdentifier().getCellarId();

        assertTrue(saved.getIsActive());

        saved.setIsActive(false);
        cellarRepository.save(saved);

        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(cellarId);
        assertNotNull(found);
        assertFalse(found.getIsActive());
    }

    // -------------------------------------------------------------------------
    // CUSTOMER RELATIONSHIP
    // -------------------------------------------------------------------------
    @Test
    void whenSaveCellar_thenOwnerCustomerRelationshipIsPreserved() {
        Customer customer = createTestCustomer("relationshiptest");
        Cellar saved = cellarRepository.save(
                buildCellar(customer.getCustomerIdentifier(), "Test Cellar", CellarType.PRIVATE));

        Cellar found = cellarRepository.findCellarByCellarIdentifier_CellarId(
                saved.getCellarIdentifier().getCellarId());

        assertNotNull(found);
        assertNotNull(found.getOwnerCustomerIdentifier());
        assertEquals(customer.getCustomerIdentifier().getCustomerId(),
                found.getOwnerCustomerIdentifier().getCustomerId());
    }
}
