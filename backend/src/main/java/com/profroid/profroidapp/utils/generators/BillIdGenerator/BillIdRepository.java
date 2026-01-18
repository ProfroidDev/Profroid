package com.profroid.profroidapp.utils.generators.BillIdGenerator;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

@Repository
public class BillIdRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public String findMaxBillId() {
        try {
            Object result = entityManager.createNativeQuery("SELECT MAX(bill_id) FROM bills").getSingleResult();
            return result != null ? result.toString() : null;
        } catch (Exception ex) {
            return null;
        }
    }
}
