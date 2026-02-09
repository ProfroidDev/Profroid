package com.profroid.profroidapp.cellarsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CellarRepository extends JpaRepository<Cellar, CellarIdentifier> {
    Cellar findCellarByCellarIdentifier_CellarId(String cellarIdentifier);
    Cellar findCellarByName(String name);
    Cellar findCellarByNameAndOwnerCustomerIdentifier_CustomerId(String name, String customerId);
    List<Cellar> findByOwnerCustomerIdentifier(CustomerIdentifier ownerCustomerIdentifier);
    
    // Find only active (not deleted) cellars by owner
    @Query("SELECT c FROM Cellar c WHERE c.ownerCustomerIdentifier = :ownerCustomerIdentifier AND (c.isDeleted = false OR c.isDeleted IS NULL)")
    List<Cellar> findActiveByOwnerCustomerIdentifier(@Param("ownerCustomerIdentifier") CustomerIdentifier ownerCustomerIdentifier);
    
    // Find active cellars by name and owner (excludes deleted cellars for duplicate name check)
    @Query("SELECT c FROM Cellar c WHERE c.name = :name AND c.ownerCustomerIdentifier.customerId = :customerId AND (c.isDeleted = false OR c.isDeleted IS NULL)")
    Cellar findActiveCellarByNameAndOwnerCustomerIdentifier_CustomerId(@Param("name") String name, @Param("customerId") String customerId);
}
