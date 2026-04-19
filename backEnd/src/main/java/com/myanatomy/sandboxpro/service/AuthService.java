package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.dto.JwtResponse;
import com.myanatomy.sandboxpro.dto.RegisterRequest;
import com.myanatomy.sandboxpro.model.User;
import com.myanatomy.sandboxpro.repository.OtpRepository;
import com.myanatomy.sandboxpro.repository.UserRepository;
import com.myanatomy.sandboxpro.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private PinService pinService;

    public void registerUser(RegisterRequest signUpRequest) {
        // Verify a confirmed OTP exists for this phone
        boolean otpVerified = !otpRepository.findByPhoneAndIsVerifiedTrue(signUpRequest.getPhone()).isEmpty();
        if (!otpVerified) {
            throw new IllegalArgumentException("Error: Mobile number not verified via OTP!");
        }

        // Check phone not already registered
        if (userRepository.findByPhone(signUpRequest.getPhone()).isPresent()) {
            throw new RuntimeException("Error: Mobile number is already in use!");
        }

        // Require organizationName for NGO and DONOR roles
        User.Role role = signUpRequest.getRole();
        if ((role == User.Role.NGO || role == User.Role.DONOR)) {
            String orgName = signUpRequest.getOrganizationName();
            if (orgName == null || orgName.isBlank()) {
                throw new IllegalArgumentException("Organization name is required for DONOR and NGO roles");
            }
        }

        // Validate and hash PIN
        pinService.validatePinFormat(signUpRequest.getPin());
        String hashedPin = pinService.hashPin(signUpRequest.getPin());

        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setPhone(signUpRequest.getPhone());
        user.setRole(role);
        user.setOrganizationName(signUpRequest.getOrganizationName());
        user.setAddress(signUpRequest.getAddress());
        user.setPin(hashedPin);
        user.setPhoneVerified(true);
        user.setStatus(User.Status.ACTIVE);

        userRepository.save(user);
    }

    public JwtResponse loginWithPin(String phone, String pin) {
        // Load user by phone
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Check account status
        if (user.getStatus() == User.Status.SUSPENDED) {
            throw new RuntimeException("Account is suspended");
        }

        // Verify PIN
        if (!pinService.verifyPin(pin, user.getPin())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Generate JWT with role (without ROLE_ prefix)
        String token = jwtUtils.generateJwtToken(phone, user.getRole().name());

        return new JwtResponse(token, phone, "ROLE_" + user.getRole().name());
    }
}
