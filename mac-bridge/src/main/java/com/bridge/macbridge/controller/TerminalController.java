package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.RunCommandRequest;
import com.bridge.macbridge.service.TerminalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/terminal")
public class TerminalController {

    private final TerminalService terminalService;

    public TerminalController(TerminalService terminalService) {
        this.terminalService = terminalService;
    }

    @PostMapping("/run")
    public ResponseEntity<?> runCommand(@Valid @RequestBody RunCommandRequest request) {
        try {
            String output = terminalService.executeCommand(request.getCommand(), request.getCwd(), request.getSessionId());
            return ResponseEntity.ok(Map.of("output", output));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/interrupt/{sessionId}")
    public ResponseEntity<?> interruptSession(@PathVariable String sessionId) {
        boolean success = terminalService.interruptSession(sessionId);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Session interrupted"));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Session not found or already finished"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<String>> getHistory() {
        return ResponseEntity.ok(terminalService.getHistory());
    }
}
