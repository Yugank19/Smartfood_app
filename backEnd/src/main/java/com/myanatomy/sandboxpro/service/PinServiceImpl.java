package com.myanatomy.sandboxpro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PinServiceImpl implements PinService {

    private static final String PIN_PATTERN = "^\\d{6}$";

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public String hashPin(String rawPin) {
        return passwordEncoder.encode(rawPin);
    }

    @Override
    public boolean verifyPin(String rawPin, String hashedPin) {
        return passwordEncoder.matches(rawPin, hashedPin);
    }

    @Override
    public void validatePinFormat(String pin) {
        if (pin == null || !pin.matches(PIN_PATTERN)) {
            throw new IllegalArgumentException("PIN must be exactly 6 numeric digits");
        }
    }
}
