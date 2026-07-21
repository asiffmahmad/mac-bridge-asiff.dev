package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.ChatRequest;
import com.bridge.macbridge.service.AntigravityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/antigravity")
public class AntigravityController {

    private final AntigravityService antigravityService;

    public AntigravityController(AntigravityService antigravityService) {
        this.antigravityService = antigravityService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(antigravityService.getStatus());
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(antigravityService.sendChat(request.getMessage()));
    }
}
