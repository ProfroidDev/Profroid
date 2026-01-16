package com.profroid.profroidapp.utils.generators.ReportIdGenerator;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ReportIdInitializer {

    private static final Pattern REPORT_ID_PATTERN = Pattern.compile("^RPT-(\\d{4})-(\\d{6})$");

    @Autowired
    private ReportIdRepository reportIdRepository;

    @PostConstruct
    public void init() {
        String maxReportId = reportIdRepository.findMaxReportId();

        if (maxReportId != null) {
            Matcher matcher = REPORT_ID_PATTERN.matcher(maxReportId);
            if (matcher.matches()) {
                int persistedYear = Integer.parseInt(matcher.group(1));
                int nextCounter = Integer.parseInt(matcher.group(2)) + 1;
                ReportIdGenerator.initialize(persistedYear, nextCounter);
                String preview = "RPT-" + persistedYear + "-" + String.format("%06d", nextCounter);
                System.out.println("Report ID Generator initialized. Next Report ID = " + preview);
                return;
            }
        }

        ReportIdGenerator.resetToBaseYear();
        System.out.println("Report ID Generator initialized. Starting from current/base year.");
    }
}
