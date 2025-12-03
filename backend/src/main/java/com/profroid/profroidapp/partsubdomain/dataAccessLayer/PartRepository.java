package com.profroid.profroidapp.partsubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PartRepository extends JpaRepository<Part, PartIdentifier> {
    Part findPartByPartIdentifier_PartId(String partId);
}
