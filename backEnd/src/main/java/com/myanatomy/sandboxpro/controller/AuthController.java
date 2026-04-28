package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.*;
import com.myanatomy.sandboxpro.service.AuthService;
import com.myanatomy.sandboxpro.service.OtpService;
import com.myanatomy.sandboxpro.service.SupabaseAuthService;
import com.myanatomy.sandboxpro.model.Otp;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private AuthService authService;
    @Autowired private OtpService otpService;
    @Autowired private SupabaseAuthService supabaseAuthService;
    @Autowired private OtpRepository otpRepository;

    /**
     * Send OTP — delegates to Supabase Auth (SMS).
     * Kept at /api/auth/send-otp for backward compatibility with existing frontend.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        String phone = request.getPhone();
        String e164 = supabaseAuthService.toE164(phone);
        boolean sent = supabaseAuthService.sendPhoneOtp(e164);
        if (sent) {
            return ResponseEntity.ok(Map.of(
                "message", "OTP sent via Supabase",
                "phone", supabaseAuthService.normalizePhone(phone)
            ));
        }
        // Fallback: try legacy OTP service (Fast2SMS)
        try {
            String result = otpService.generateAndSendOtp(supabaseAuthService.normalizePhone(phone));
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Failed to send OTP. Please try again."));
        }
    }

    /**
     * Verify OTP — frontend has already verified with Supabase JS SDK.
     * This endpoint just marks the phone as verified in our DB.
     * Kept for backward compatibility with existing frontend calls.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        String normalizedPhone = supabaseAuthService.normalizePhone(request.getPhone());

        // Mark phone as verified (frontend already verified with Supabase)
        markPhoneVerified(normalizedPhone);

        return ResponseEntity.ok(Map.of(
            "message", "Phone verified successfully",
            "phone", normalizedPhone,
            "verified", true
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            authService.registerUser(registerRequest);
            return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", 400, "error", "Bad Request", "message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", 500, "error", "Internal Server Error",
                            "message", ex.getMessage() != null ? ex.getMessage() : "Unknown error"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest request) {
        try {
            JwtResponse jwtResponse = authService.loginWithPin(request.getPhone(), request.getPin());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "error", "Unauthorized",
                            "message", ex.getMessage() != null ? ex.getMessage() : "Invalid credentials"));
        }
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private void markPhoneVerified(String phone) {
        otpRepository.deleteByPhone(phone);
        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setOtpCode("SUPABASE_VERIFIED");
        otp.setExpiryTime(LocalDateTime.now().plusHours(2));
        otp.setVerified(true);
        otpRepository.save(otp);
    }
}
