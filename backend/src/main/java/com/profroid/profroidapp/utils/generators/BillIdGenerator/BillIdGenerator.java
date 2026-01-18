package com.profroid.profroidapp.utils.generators.BillIdGenerator;

import java.time.Year;

public class BillIdGenerator {

    private static final String PREFIX = "BILL-";
    private static final Object lock = new Object();
    private static int counter = 1;
    private static int year = Year.now().getValue();

    static void initialize(int persistedYear, int nextCounter) {
        synchronized (lock) {
            year = persistedYear;
            counter = nextCounter;
        }
    }

    static void resetToCurrentYear() {
        synchronized (lock) {
            year = Year.now().getValue();
            counter = 1;
        }
    }

    public static String generateBillId() {
        synchronized (lock) {
            int currentYear = Year.now().getValue();
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
