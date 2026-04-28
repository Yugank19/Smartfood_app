package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.Otp;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * OTP Service — Supabase Edition
 *
 * Primary OTP delivery: Supabase Auth (via SupabaseAuthService)
 * Fallback: console-only OTP for dev/testing
 *
 * This service is kept for legacy /api/auth/send-otp and /api/auth/verify-otp
 * compatibility. New code should use SupabaseAuthService directly.
 */
@Service
public class OtpService {

    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private SupabaseAuthService supabaseAuthService;

    /**
     * Generates a 6-digit OTP, saves it to DB, and sends via Supabase Auth.
     * Always prints OTP to console for dev convenience.
     */
    public String generateAndSendOtp(String phone) {
        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));

        // Persist OTP
        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setOtpCode(otpCode);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        otpRepository.save(otp);

        // Always log to console for dev/testing
        System.out.println("===========================================");
        System.out.println("OTP for " + phone + " : " + otpCode);
        System.out.println("===========================================");

        // Try Supabase SMS delivery
        try {
            String e164 = supabaseAuthService.toE164(phone);
            boolean sent = supabaseAuthService.sendPhoneOtp(e164);
            if (sent) {
                return "OTP sent to " + phone;
            }
        } catch (Exception e) {
            System.err.println("[OtpService] Supabase SMS failed: " + e.getMessage());
        }

        // Dev fallback — return OTP in response body
        return "Dev Mode — OTP: " + otpCode;
    }

    /**
     * Verifies OTP against our local DB table.
     * Used as fallback when Supabase verification is not available.
     */
    public boolean verifyOtp(String phone, String code) {
        Optional<Otp> otpOpt = otpRepository.findTopByPhoneAndOtpCodeOrderByCreatedAtDesc(phone, code);
        if (otpOpt.isPresent()) {
            Otp otp = otpOpt.get();
            if (!otp.isExpired() && !otp.isVerified()) {
                otp.setVerified(true);
                otpRepository.save(otp);
                return true;
            }
        }
        return false;
    }
}
