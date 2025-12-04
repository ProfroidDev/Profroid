package com.profroid.profroidapp.utils.generators;

import java.security.SecureRandom;

public class SkuGenerator {

    private static final String PREFIX = "PC-";
    private static final int SKU_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    // lock to ensure thread-safety under high concurrency (same as PetClinic architecture)
    private static final Object lock = new Object();

    public static String generateSku() {
        synchronized (lock) {
            return PREFIX + generateRandomDigits(SKU_LENGTH);
        }
    }

    private static String generateRandomDigits(int length) {
        StringBuilder result = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int digit = RANDOM.nextInt(10); // 0–9
            result.append(digit);
        }
        return result.toString();
    }
}
