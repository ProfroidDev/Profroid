package com.profroid.profroidapp.filesubdomain.utils;

public class FilenameSanitizer {

    private FilenameSanitizer() {}

    public static String sanitize(String original) {
        if (original == null || original.isBlank()) return "file";
        String sanitized = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        // Collapse multiple consecutive dots to a single dot to avoid ".." segments
        sanitized = sanitized.replaceAll("\\.{2,}", ".");
        // Remove leading dots to prevent hidden files and dot-prefixed paths
        sanitized = sanitized.replaceAll("^\\.+", "");
        if (sanitized.isBlank()) {
            return "file";
        }
        return sanitized;
    }
}
