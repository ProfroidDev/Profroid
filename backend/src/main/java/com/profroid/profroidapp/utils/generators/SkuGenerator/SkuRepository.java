package com.profroid.profroidapp.utils.generators.SkuGenerator;

import com.profroid.profroidapp.partsubdomain.dataAccessLayer.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SkuRepository extends JpaRepository<Part, Integer> {
    @Query("SELECT MAX(p.partIdentifier.partId) FROM Part p")
    String findMaxSku();
}
