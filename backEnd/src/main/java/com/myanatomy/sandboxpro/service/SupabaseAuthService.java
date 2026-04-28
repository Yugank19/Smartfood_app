package com.myanatomy.sandboxpro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.Map;

/**
 * Supabase Auth Service
 *
 * Handles:
 * 1. Sending phone OTP via Supabase Auth REST API
 * 2. Verifying phone OTP and returning the Supabase access token
 * 3. Extracting phone number from a Supabase JWT access token
 *
 * Supabase Auth endpoints used:
 *   POST /auth/v1/otp          — send OTP to phone
 *   POST /auth/v1/verify       — verify OTP, returns access_token
 */
@Service
public class SupabaseAuthService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    private WebClient webClient() {
        return WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", anonKey)
                .build();
    }

    /**
     * Sends a phone OTP via Supabase Auth.
     * Phone must be in E.164 format: +919876543210
     *
     * @return true if OTP was sent successfully
     */
    public boolean sendPhoneOtp(String phone) {
        try {
            Map<String, Object> body = Map.of("phone", phone);
            String response = webClient()
                    .post()
                    .uri("/auth/v1/otp")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            System.out.println("[Supabase] OTP sent to " + phone + " | response: " + response);
            return true;
        } catch (Exception e) {
            System.err.println("[Supabase] Failed to send OTP to " + phone + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Verifies the OTP entered by the user.
     * NOTE: This should only be called from the backend with service_role key.
     * For frontend flows, use the Supabase JS SDK (supabase.auth.verifyOtp) instead.
     *
     * Returns the Supabase access token (JWT) on success, null on failure.
     */
    @SuppressWarnings("unchecked")
    public String verifyPhoneOtp(String phone, String token) {
        try {
            Map<String, Object> body = Map.of(
                "phone", phone,
                "token", token,
                "type", "sms"
            );
            // Use service_role key for server-side verification
            WebClient serviceClient = WebClient.builder()
                    .baseUrl(supabaseUrl)
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader("apikey", serviceRoleKey)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                    .build();

            Map<String, Object> response = serviceClient
                    .post()
                    .uri("/auth/v1/verify")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("access_token")) {
                return (String) response.get("access_token");
            }
            System.err.println("[Supabase] OTP verify failed: " + response);
            return null;
        } catch (Exception e) {
            System.err.println("[Supabase] OTP verify error: " + e.getMessage());
            return null;
        }
    }

    /**
     * Extracts the phone number from a Supabase JWT access token.
     * Supabase embeds the phone in the "phone" claim of the JWT payload.
     *
     * @param accessToken  Supabase JWT access token
     * @return phone number (E.164) or null if extraction fails
     */
    @SuppressWarnings("unchecked")
    public String extractPhoneFromToken(String accessToken) {
        try {
            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) return null;

            // Decode base64url payload
            String paddedPayload = parts[1];
            int pad = paddedPayload.length() % 4;
            if (pad != 0) paddedPayload += "=".repeat(4 - pad);

            byte[] decoded = Base64.getUrlDecoder().decode(paddedPayload);
            String json = new String(decoded);

            // Parse JSON manually (avoid extra dependency)
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> claims = mapper.readValue(json, Map.class);

            // Supabase stores phone in "phone" claim
            Object phone = claims.get("phone");
            if (phone != null && !phone.toString().isBlank()) {
                return phone.toString();
            }

            // Fallback: check "sub" (user ID) — not a phone, but log it
            System.err.println("[Supabase] No phone claim in token. Claims: " + claims.keySet());
            return null;
        } catch (Exception e) {
            System.err.println("[Supabase] Token decode error: " + e.getMessage());
            return null;
        }
    }

    /**
     * Normalizes a phone number to 10-digit format (strips country code).
     * +919876543210 → 9876543210
     */
    public String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            return digits.substring(digits.length() - 10);
        }
        return digits;
    }

    /**
     * Formats a 10-digit phone to E.164 for Supabase (+91 prefix for India).
     * 9876543210 → +919876543210
     */
    public String toE164(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        if (phone.startsWith("+")) return phone; // already E.164
        if (digits.length() == 10) return "+91" + digits;
        if (digits.length() == 12 && digits.startsWith("91")) return "+" + digits;
        return "+" + digits;
    }
}
