package com.profroid.profroidapp.cellarsubdomain.dataAccessLayer;

import com.profroid.profroidapp.customersubdomain.dataAccessLayer.CustomerIdentifier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CellarRepository extends JpaRepository<Cellar, CellarIdentifier> {
    Cellar findCellarByCellarIdentifier_CellarId(String cellarIdentifier);
    List<Cellar> findByOwnerCustomerIdentifier(CustomerIdentifier ownerCustomerIdentifier);



}
