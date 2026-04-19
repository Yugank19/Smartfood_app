package com.myanatomy.sandboxpro.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String phone;
    private String pin;
}
