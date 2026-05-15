package com.myanatomy.sandboxpro.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "MealBridge Backend is LIVE and connected to Supabase!";
    }
}
