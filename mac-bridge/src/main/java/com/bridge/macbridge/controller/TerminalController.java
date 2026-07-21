package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.RunCommandRequest;
import com.bridge.macbridge.service.TerminalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/terminal")
public class TerminalController {

    private final TerminalService terminalService;

    public TerminalController(TerminalService terminalService) {
        this.terminalService = terminalService;
    }

    @PostMapping("/run")
    public ResponseEntity<String> runCommand(@Valid @RequestBody RunCommandRequest request) {
        String output = terminalService.executeCommand(request.getCommand());
        return ResponseEntity.ok(output);
    }
}
