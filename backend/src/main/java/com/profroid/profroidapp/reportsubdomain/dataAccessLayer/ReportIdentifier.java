package com.profroid.profroidapp.reportsubdomain.dataAccessLayer;

import com.profroid.profroidapp.utils.generators.SkuGenerator.SkuGenerator;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

@Embeddable
@Getter
public class ReportIdentifier {

    @Column(name = "report_id", unique = true, nullable = false)
    private String reportId;

    public ReportIdentifier() {
        this.reportId = SkuGenerator.generateSku();
    }

    public ReportIdentifier(String reportId) {
        this.reportId = reportId;
    }
}
