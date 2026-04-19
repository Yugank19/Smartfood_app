package com.myanatomy.sandboxpro.dto;

import com.myanatomy.sandboxpro.model.User;
import lombok.Data;

@Data
public class RegisterRequest {
    private String phone;
    private String fullName;
    private User.Role role;
    private String organizationName;
    private String address;
    private String pin;
}
