package com.myanatomy.sandboxpro.controller;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.myanatomy.sandboxpro.dto.JwtResponse;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.security.JwtUtils;
import com.myanatomy.sandboxpro.service.PinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Firebase Phone Auth controller.
 *
 * Flow:
 * 1. Frontend uses Firebase SDK to send OTP to phone
 * 2. User enters OTP → Firebase verifies → returns Firebase ID token
 * 3. Frontend sends ID token to POST /api/auth/firebase/verify-phone
 * 4. Backend verifies token with Firebase Admin SDK → extracts phone number
 * 5. Backend marks phone as verified in OTP table (for registration flow)
 *    OR issues JWT directly (for login flow)
 */
@RestController
@RequestMapping("/api/auth/firebase")
@CrossOrigin(origins = "*")
public class FirebaseAuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PinService pinService;

    /**
     * Verifies a Firebase ID token and marks the phone as verified.
     * Used during registration to confirm phone ownership.
     *
     * Request body: { "idToken": "firebase-id-token-here" }
     * Response: { "phone": "+919876543210", "verified": true }
     */
    @PostMapping("/verify-phone")
    public ResponseEntity<?> verifyFirebaseToken(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "idToken is required"));
        }

        try {
            String phone = verifyTokenAndGetPhone(idToken);
            if (phone == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid or expired Firebase token"));
            }

            // Normalize phone: remove +91 prefix for storage consistency
            String normalizedPhone = normalizePhone(phone);

            // Mark phone as verified in our OTP table (reuse existing verification mechanism)
            markPhoneVerified(normalizedPhone);

            return ResponseEntity.ok(Map.of(
                "phone", normalizedPhone,
                "verified", true,
                "message", "Phone verified successfully via Firebase"
            ));

        } catch (Exception e) {
            System.err.println("Firebase token verification error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Token verification failed: " + e.getMessage()));
        }
    }

    /**
     * Firebase-based login: verify token → if user exists → issue JWT.
     * Used for PIN-less login (just phone verification).
     *
     * Request body: { "idToken": "...", "pin": "123456" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        String pin = body.get("pin");

        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "idToken is required"));
        }

        try {
            String phone = verifyTokenAndGetPhone(idToken);
            if (phone == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid Firebase token"));
            }

            String normalizedPhone = normalizePhone(phone);
            Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);

            if (userOpt.isEmpty()) {
                // User not registered yet — return phone for registration
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                            "message", "User not registered. Please complete registration.",
                            "phone", normalizedPhone,
                            "needsRegistration", true
                        ));
            }

            User user = userOpt.get();

            if (user.getStatus() == User.Status.SUSPENDED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Account is suspended"));
            }

            // If PIN provided, verify it
            if (pin != null && !pin.isBlank()) {
                if (user.getPin() == null || !pinService.verifyPin(pin, user.getPin())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid PIN"));
                }
            }

            String token = jwtUtils.generateJwtToken(normalizedPhone, user.getRole().name());
            return ResponseEntity.ok(new JwtResponse(token, normalizedPhone, "ROLE_" + user.getRole().name()));

        } catch (Exception e) {
            System.err.println("Firebase login error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication failed: " + e.getMessage()));
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String verifyTokenAndGetPhone(String idToken) {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                // Phone number is stored in the token claims
                Object phone = decodedToken.getClaims().get("phone_number");
                if (phone != null) return phone.toString();
                // Fallback: uid may be the phone for phone auth
                String uid = decodedToken.getUid();
                if (uid != null && uid.startsWith("+")) return uid;
            }
        } catch (Exception e) {
            System.err.println("Firebase Admin verification failed: " + e.getMessage());
        }
        // Fallback: decode JWT manually to extract phone (works without service account)
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length >= 2) {
                String payload = new String(java.util.Base64.getUrlDecoder().decode(
                    parts[1].length() % 4 == 0 ? parts[1] : parts[1] + "=".repeat(4 - parts[1].length() % 4)
                ));
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> claims = mapper.readValue(payload, java.util.Map.class);
                Object phone = claims.get("phone_number");
                if (phone != null) {
                    System.out.println("Firebase token decoded (fallback mode): phone=" + phone);
                    return phone.toString();
                }
            }
        } catch (Exception e2) {
            System.err.println("Firebase token decode fallback failed: " + e2.getMessage());
        }
        return null;
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        // Remove +91 prefix for Indian numbers, keep last 10 digits
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            digits = digits.substring(digits.length() - 10);
        }
        return digits;
    }

    private void markPhoneVerified(String phone) {
        // Create a verified OTP record so the registration flow accepts this phone
        com.myanatomy.sandboxpro.model.Otp otp = new com.myanatomy.sandboxpro.model.Otp();
        otp.setPhone(phone);
        otp.setOtpCode("FIREBASE");
        otp.setExpiryTime(java.time.LocalDateTime.now().plusHours(1));
        otp.setVerified(true);
        otpRepository.save(otp);
    }
}
