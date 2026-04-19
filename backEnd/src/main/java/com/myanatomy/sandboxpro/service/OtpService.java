package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.Otp;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.security.SecureRandom;

@Service
public class OtpService {

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${fast2sms.api.key}")
    private String apiKey;

    @Value("${fast2sms.url}")
    private String apiUrl;

    @Autowired
    private OtpRepository otpRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateAndSendOtp(String phone) {
        // Generate 6 digit OTP using SecureRandom
        String otpCode = String.format("%06d", secureRandom.nextInt(1000000));
        
        // Save to DB
        Otp otp = new Otp();
        otp.setPhone(phone);
        otp.setOtpCode(otpCode);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10)); // 10 min expiry
        otpRepository.save(otp);

        // Always log OTP to console for dev/testing
        System.out.println("===========================================");
        System.out.println("OTP for " + phone + " : " + otpCode);
        System.out.println("===========================================");

        try {
            // Normalize phone number to 10 digits (Indian format)
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            if (cleanPhone.length() > 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
            }

            // Try Fast2SMS v3 route (Bulk SMS Service - OTP template, no DLT needed)
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("route", "v3");
            body.put("sender_id", "FTSMS");
            body.put("message", "167078");          // Fast2SMS default OTP template ID
            body.put("variables_values", otpCode);
            body.put("flash", "0");
            body.put("numbers", cleanPhone);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            System.out.println("Fast2SMS: Sending OTP to " + cleanPhone + " via v3 route");

            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Fast2SMS Success: " + response.getBody());
                // Return OTP in response for dev convenience (remove in production)
                return "OTP sent to " + phone + " | Dev code: " + otpCode;
            } else {
                System.err.println("Fast2SMS Error (" + response.getStatusCode() + "): " + response.getBody());
                return "SMS delivery issue. Use this code: " + otpCode;
            }
        } catch (Exception e) {
            System.err.println("Fast2SMS Exception: " + e.getMessage());
            // Return OTP directly so dev/testing always works
            return "Dev Mode - Your OTP is: " + otpCode;
        }
    }

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
