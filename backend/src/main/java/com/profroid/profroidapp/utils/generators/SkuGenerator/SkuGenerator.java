package com.profroid.profroidapp.utils.generators.SkuGenerator;

public class SkuGenerator {

    private static final String PREFIX = "PC-";
    private static int counter = 1;

    private static final Object lock = new Object();

    public static void setCounter(int next) {
        counter = next;
    }

    public static int getCounter() {
        return counter;
    }

    public static String generateSku() {
        synchronized (lock) {
            String sku = PREFIX + String.format("%06d", counter);
            counter++;
            return sku;
        }
    }
}

