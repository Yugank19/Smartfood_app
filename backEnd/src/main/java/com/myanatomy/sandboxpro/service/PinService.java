package com.myanatomy.sandboxpro.service;

public interface PinService {

    /**
     * Hashes a raw PIN using BCrypt.
     *
     * @param rawPin the plain-text 6-digit PIN
     * @return the BCrypt-hashed PIN
     */
    String hashPin(String rawPin);

    /**
     * Verifies a raw PIN against a stored BCrypt hash.
     *
     * @param rawPin     the plain-text PIN to check
     * @param hashedPin  the stored BCrypt hash
     * @return true if the PIN matches the hash, false otherwise
     */
    boolean verifyPin(String rawPin, String hashedPin);

    /**
     * Validates that the given PIN is exactly 6 numeric digits.
     *
     * @param pin the PIN string to validate
     * @throws IllegalArgumentException if the PIN does not match {@code ^\d{6}$}
     */
    void validatePinFormat(String pin);
}
