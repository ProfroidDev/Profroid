package com.profroid.profroidapp.partsubdomain.dataAccessLayer;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PartRepository extends JpaRepository<Part, Integer> {
    Part findPartByPartIdentifier_PartId(String partId);

    Part findPartByName(String name);
}
