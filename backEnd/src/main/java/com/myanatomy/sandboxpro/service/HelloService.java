package com.myanatomy.sandboxpro.service;

import com.myanatomy.sandboxpro.model.FoodListing;
import com.myanatomy.sandboxpro.repository.FoodListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HelloService {

    @Autowired
    private FoodListingRepository foodListingRepository;

    public List<FoodListing> getAllAvailableFood() {
        return foodListingRepository.findByStatus(FoodListing.ListingStatus.AVAILABLE);
    }

    public FoodListing postFoodListing(FoodListing listing) {
        return foodListingRepository.save(listing);
    }

    public String getWelcomeMessage() {
        return "Welcome to the Smart Food Redistribution Platform!";
    }
}
