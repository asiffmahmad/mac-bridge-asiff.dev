package com.bridge.macbridge.controller;

import com.bridge.macbridge.service.SystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final SystemService systemService;

    public HealthController(SystemService systemService) {
        this.systemService = systemService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(systemService.getHealth());
    }
}
