package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.*;
import com.myanatomy.sandboxpro.service.AuthService;
import com.myanatomy.sandboxpro.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        String result = otpService.generateAndSendOtp(request.getPhone());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        boolean isValid = otpService.verifyOtp(request.getPhone(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok("Phone verified successfully!");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            System.out.println("=== REGISTER REQUEST ===");
            System.out.println("Phone: " + registerRequest.getPhone());
            System.out.println("FullName: " + registerRequest.getFullName());
            System.out.println("Role: " + registerRequest.getRole());
            System.out.println("OrgName: " + registerRequest.getOrganizationName());
            System.out.println("PIN length: " + (registerRequest.getPin() != null ? registerRequest.getPin().length() : "null"));
            System.out.println("========================");
            authService.registerUser(registerRequest);
            return ResponseEntity.ok("User registered successfully!");
        } catch (IllegalArgumentException ex) {
            System.err.println("Registration validation error: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("status", 400, "error", "Bad Request", "message", ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("Registration error: " + ex.getClass().getName() + ": " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("status", 500, "error", "Internal Server Error", "message", ex.getMessage() != null ? ex.getMessage() : "Unknown error"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest request) {
        try {
            JwtResponse jwtResponse = authService.loginWithPin(request.getPhone(), request.getPin());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception ex) {
            System.err.println("Login error: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("status", 401, "error", "Unauthorized", "message", ex.getMessage() != null ? ex.getMessage() : "Invalid credentials"));
        }
    }
}
