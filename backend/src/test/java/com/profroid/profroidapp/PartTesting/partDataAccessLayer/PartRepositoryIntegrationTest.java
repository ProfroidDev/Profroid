package com.profroid.profroidapp.PartTesting.partDataAccessLayer;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartIdentifier;
import com.profroid.profroidapp.partsubdomain.dataAccessLayer.PartRepository;
import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
@SpringBootTest
public class PartRepositoryIntegrationTest {

    @Autowired
    private PartRepository partRepository;

    private Part savedPart;
    private String savedPartId;

    @BeforeEach
    void setup() {
        partRepository.deleteAll();

        PartIdentifier identifier = new PartIdentifier(SkuGenerator.generateSku());

        Part part = new Part();
        part.setPartIdentifier(identifier);
        part.setName("Filter Cartridge");
        part.setCategory("Filters");
        part.setQuantity(10);
        part.setPrice(BigDecimal.valueOf(19.99));
        part.setSupplier("Acme Supplies");
        part.setAvailable(true);

        savedPart = partRepository.save(part);
        savedPartId = identifier.getPartId();
    }

    @AfterEach
    void cleanup() {
        partRepository.deleteAll();
    }

    @Test
    void whenSavePart_thenItCanBeRetrieved() {
        Part found = partRepository.findPartByPartIdentifier_PartId(savedPartId);

        assertNotNull(found);
        assertEquals("Filter Cartridge", found.getName());
        assertTrue(found.getAvailable());
    }

    @Test
    void whenFindByName_thenReturnCorrectPart() {
        Part found = partRepository.findPartByName("Filter Cartridge");

        assertNotNull(found);
        assertEquals(savedPartId, found.getPartIdentifier().getPartId());
    }

    @Test
    void whenFindByName_withNonExistingName_thenReturnNull() {
        assertNull(partRepository.findPartByName("Does Not Exist"));
    }

    @Test
    void whenFindAll_thenReturnListOfParts() {
        List<Part> parts = partRepository.findAll();

        assertEquals(1, parts.size());
        assertEquals("Filter Cartridge", parts.get(0).getName());
    }

    @Test
    void whenUpdatePart_thenChangesArePersisted() {
        Part found = partRepository.findPartByPartIdentifier_PartId(savedPartId);

        found.setName("Updated Filter");
        found.setAvailable(false);

        partRepository.save(found);

        Part updated = partRepository.findPartByPartIdentifier_PartId(savedPartId);

        assertEquals("Updated Filter", updated.getName());
        assertFalse(updated.getAvailable());
    }

    @Test
    void whenSoftDeletePart_thenAvailableFlagIsPersisted() {
        Part found = partRepository.findPartByPartIdentifier_PartId(savedPartId);

        found.setAvailable(false);
        partRepository.save(found);

        Part updated = partRepository.findPartByPartIdentifier_PartId(savedPartId);

        assertFalse(updated.getAvailable());
    }

    @Test
    void whenFindById_withInvalidId_thenReturnNull() {
        Part found = partRepository.findPartByPartIdentifier_PartId("INVALID-ID");

        assertNull(found);
    }
}
