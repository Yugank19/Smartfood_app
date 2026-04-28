package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.JwtResponse;
import com.myanatomy.sandboxpro.model.Otp;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.security.JwtUtils;
import com.myanatomy.sandboxpro.service.PinService;
import com.myanatomy.sandboxpro.service.SupabaseAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Supabase Phone Auth Controller
 *
 * Hybrid OTP flow:
 *   1. Try Supabase SMS (works for numbers added in Supabase Dashboard test list,
 *      or on paid plan for any number)
 *   2. If Supabase can't send (free plan restriction), fall back to backend-generated
 *      OTP stored in DB and printed to console
 *
 * Verification:
 *   - Frontend verifies with Supabase JS SDK (supabase.auth.verifyOtp)
 *   - If that fails (number not in Supabase), frontend sends OTP to backend
 *     which checks against the DB-stored code
 */
@RestController
@RequestMapping("/api/auth/supabase")
@CrossOrigin(origins = "*")
public class SupabaseAuthController {

    @Autowired private SupabaseAuthService supabaseAuthService;
    @Autowired private OtpRepository otpRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private PinService pinService;

    private final SecureRandom secureRandom = new SecureRandom();

    // ── SEND OTP ─────────────────────────────────────────────────────────────

    /**
     * Send OTP — tries Supabase SMS, always generates a backend OTP as fallback.
     *
     * Request:  { "phone": "9876543210" }
     * Response: { "phone": "9876543210", "message": "...", "devOtp": "123456" (dev only) }
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "phone is required"));
        }

        String normalizedPhone = supabaseAuthService.normalizePhone(phone);
        String e164 = supabaseAuthService.toE164(phone);

        // Always generate a backend OTP (works for ALL numbers)
        String backendOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        saveBackendOtp(normalizedPhone, backendOtp);

        // ── SIMULATED OTP FLOW (Supabase Connection Cut) ─────────────────────
        // We no longer call supabaseAuthService.sendPhoneOtp(e164);
        
        // Always print to console for dev/testing
        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║  TEST OTP for " + normalizedPhone + " : " + backendOtp + "  ║");
        System.out.println("╚══════════════════════════════════════╝");

        // Return the backend OTP to be shown in the UI
        return ResponseEntity.ok(Map.of(
            "phone", normalizedPhone,
            "message", "Test verification code generated successfully.",
            "supabaseSent", false,
            "devOtp", backendOtp
        ));
    }

    // ── VERIFY OTP ───────────────────────────────────────────────────────────

    /**
     * Verify OTP — checks backend DB (works for ALL numbers).
     * Frontend should call this after supabase.auth.verifyOtp() fails.
     *
     * Request:  { "phone": "9876543210", "token": "123456" }
     * Response: { "phone": "9876543210", "verified": true }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String token = body.get("token");

        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "phone is required"));
        }
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "token is required"));
        }

        String normalizedPhone = supabaseAuthService.normalizePhone(phone);

        // Check backend OTP table
        boolean valid = verifyBackendOtp(normalizedPhone, token.trim());
        if (valid) {
            markPhoneVerified(normalizedPhone);
            return ResponseEntity.ok(Map.of(
                "phone", normalizedPhone,
                "verified", true,
                "message", "Phone verified successfully"
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid or expired OTP. Please try again."));
    }

    /**
     * Mark phone as verified — called after frontend Supabase JS SDK verification succeeds.
     * No Supabase backend call here.
     *
     * Request:  { "phone": "9876543210" }
     */
    @PostMapping("/mark-verified")
    public ResponseEntity<?> markVerified(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "phone is required"));
        }
        String normalizedPhone = supabaseAuthService.normalizePhone(phone);
        markPhoneVerified(normalizedPhone);
        return ResponseEntity.ok(Map.of(
            "phone", normalizedPhone,
            "verified", true,
            "message", "Phone marked as verified"
        ));
    }

    // ── LOGIN via OTP ─────────────────────────────────────────────────────────

    /**
     * OTP-based login (alternative to PIN login).
     * Verifies OTP from backend DB, issues JWT if user exists.
     *
     * Request:  { "phone": "9876543210", "token": "123456" }
     */
    @PostMapping("/login")
    public ResponseEntity<?> supabaseLogin(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String token = body.get("token");

        if (phone == null || token == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "phone and token are required"));
        }

        String normalizedPhone = supabaseAuthService.normalizePhone(phone);
        boolean valid = verifyBackendOtp(normalizedPhone, token.trim());

        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired OTP"));
        }

        Optional<User> userOpt = userRepository.findByPhone(normalizedPhone);
        if (userOpt.isEmpty()) {
            markPhoneVerified(normalizedPhone);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "message", "Phone verified but not registered. Please complete registration.",
                "phone", normalizedPhone,
                "needsRegistration", true
            ));
        }

        User user = userOpt.get();
        if (user.getStatus() == User.Status.SUSPENDED) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is suspended. Contact support."));
        }

        String jwt = jwtUtils.generateJwtToken(normalizedPhone, user.getRole().name());
        return ResponseEntity.ok(new JwtResponse(jwt, normalizedPhone, "ROLE_" + user.getRole().name()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @Transactional
    private void saveBackendOtp(String phone, String code) {
        // Delete old OTPs for this phone first (within same transaction)
        otpRepository.deleteByPhone(phone);
        otpRepository.flush(); // ensure delete is committed before insert
        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setOtpCode(code);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otp.setVerified(false);
        Otp saved = otpRepository.save(otp);
        otpRepository.flush();
        System.out.println("[OTP] Saved OTP id=" + saved.getId() + " phone=" + phone + " code=" + code + " expiry=" + saved.getExpiryTime());
    }

    private boolean verifyBackendOtp(String phone, String code) {
        System.out.println("[OTP] Verifying phone=" + phone + " code=" + code);
        Optional<Otp> found = otpRepository.findTopByPhoneAndOtpCodeOrderByCreatedAtDesc(phone, code);
        System.out.println("[OTP] Found=" + found.isPresent() + (found.isPresent() ? " expired=" + found.get().isExpired() + " verified=" + found.get().isVerified() : ""));
        return found.map(otp -> {
                    if (!otp.isExpired() && !otp.isVerified()) {
                        otp.setVerified(true);
                        otpRepository.save(otp);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }

    private void markPhoneVerified(String phone) {
        otpRepository.deleteByPhone(phone);
        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setOtpCode("VERIFIED");
        otp.setExpiryTime(LocalDateTime.now().plusHours(2));
        otp.setVerified(true);
        otpRepository.save(otp);
    }
}
