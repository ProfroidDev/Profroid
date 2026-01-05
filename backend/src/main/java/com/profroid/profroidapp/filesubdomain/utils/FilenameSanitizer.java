package com.profroid.profroidapp.filesubdomain.utils;

public class FilenameSanitizer {

    private FilenameSanitizer() {}

    public static String sanitize(String original) {
        if (original == null || original.isBlank()) return "file";
        return original.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
