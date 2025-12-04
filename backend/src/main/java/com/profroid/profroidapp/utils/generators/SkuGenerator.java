package com.profroid.profroidapp.utils.generators;

public class SkuGenerator {

    private static final String PREFIX = "PC-";
    private static final int SKU_LENGTH = 6;

    // You have 937 products already → next is 938
    private static int counter = 938;

    private static final Object lock = new Object();

    public static String generateSku() {
        synchronized (lock) {

            String sku = PREFIX + String.format("%06d", counter);

            counter++;

            // Wrap protection (optional)
            if (counter > 999_999) {
                counter = 0;
            }

            return sku;
        }
    }
}
