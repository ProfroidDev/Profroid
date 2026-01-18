package com.profroid.profroidapp.utils.generators.ReportIdGenerator;

import java.time.Year;

public class ReportIdGenerator {

    private static final String PREFIX = "RPT-";
    private static final int BASE_YEAR = 2026;
    private static final Object lock = new Object();
    private static int counter = 1;
    private static int year = Math.max(Year.now().getValue(), BASE_YEAR);

    static void initialize(int persistedYear, int nextCounter) {
        synchronized (lock) {
            year = persistedYear;
            counter = nextCounter;
        }
    }

    static void resetToBaseYear() {
        synchronized (lock) {
            year = Math.max(Year.now().getValue(), BASE_YEAR);
            counter = 1;
        }
    }

    public static String generateReportId() {
        synchronized (lock) {
            int currentYear = Math.max(Year.now().getValue(), BASE_YEAR);
            if (currentYear != year) {
                year = currentYear;
                counter = 1;
            }

            String id = PREFIX + year + "-" + String.format("%06d", counter);
            counter++;
            return id;
        }
    }
}
