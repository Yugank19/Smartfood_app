package com.myanatomy.sandboxpro.controller;

import com.myanatomy.sandboxpro.dto.PublicAnalyticsDTO;
import com.myanatomy.sandboxpro.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/public")
    public ResponseEntity<PublicAnalyticsDTO> getPublicAnalytics() {
        return ResponseEntity.ok(analyticsService.getPublicAnalytics());
    }
}
