package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.ChatMessageDto;
import com.bridge.macbridge.dto.ChatRequest;
import com.bridge.macbridge.dto.ChatSessionDto;
import com.bridge.macbridge.service.AntigravityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/antigravity")
public class AntigravityController {

    private final AntigravityService antigravityService;

    public AntigravityController(AntigravityService antigravityService) {
        this.antigravityService = antigravityService;
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionDto>> getSessions() {
        return ResponseEntity.ok(antigravityService.getSessions());
    }
    
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<List<ChatMessageDto>> getSessionHistory(@PathVariable String sessionId) {
        return ResponseEntity.ok(antigravityService.getSessionHistory(sessionId));
    }
    
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteSession(@PathVariable String sessionId) {
        antigravityService.deleteSession(sessionId);
        return ResponseEntity.ok(Map.of("message", "Session deleted"));
    }
    
    @PostMapping("/cancel/{sessionId}")
    public ResponseEntity<Map<String, String>> cancelRequest(@PathVariable String sessionId) {
        antigravityService.cancelRequest(sessionId);
        return ResponseEntity.ok(Map.of("message", "Request cancelled"));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(antigravityService.sendChat(request.getSessionId(), request.getMessage()));
    }
}
