package com.profroid.profroidapp.utils.generators.BillIdGenerator;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class BillIdInitializer {

    private static final Pattern BILL_ID_PATTERN = Pattern.compile("^BILL-(\\d{4})-(\\d{6})$");

    @Autowired
    private BillIdRepository billIdRepository;

    @PostConstruct
    public void init() {
        String maxBillId = billIdRepository.findMaxBillId();

        if (maxBillId != null) {
            Matcher matcher = BILL_ID_PATTERN.matcher(maxBillId);
            if (matcher.matches()) {
                int persistedYear = Integer.parseInt(matcher.group(1));
                int nextCounter = Integer.parseInt(matcher.group(2)) + 1;
                BillIdGenerator.initialize(persistedYear, nextCounter);
                String preview = "BILL-" + persistedYear + "-" + String.format("%06d", nextCounter);
                System.out.println("Bill ID Generator initialized. Next Bill ID = " + preview);
                return;
            }
        }

        BillIdGenerator.resetToCurrentYear();
        System.out.println("Bill ID Generator initialized. Starting from current year.");
    }
}
