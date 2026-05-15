package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.service.HelloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*") // For local development with React
public class HelloController {

    @Autowired
    private HelloService helloService;

    @GetMapping("/")
    public String index() {
        return "MealBridge Backend is LIVE and connected to Supabase!";
    }

    @GetMapping("/api/hello")
    public String sayHello() {
        return helloService.getWelcomeMessage();
    }

    @GetMapping("/api/food-listings")
    public List<FoodListing> getAvailableFood() {
        return helloService.getAllAvailableFood();
    }

    @PostMapping("/api/food-listings")
    public FoodListing addFoodListing(@RequestBody FoodListing listing) {
        return helloService.postFoodListing(listing);
    }
}
