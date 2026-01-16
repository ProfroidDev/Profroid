package com.profroid.profroidapp.utils.generators.ReportIdGenerator;

import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportIdRepository extends JpaRepository<Report, Integer> {
    @Query("SELECT MAX(r.reportIdentifier.reportId) FROM Report r")
    String findMaxReportId();
}
