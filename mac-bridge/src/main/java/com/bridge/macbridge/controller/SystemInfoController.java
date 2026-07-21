package com.bridge.macbridge.controller;

import com.bridge.macbridge.service.SystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemInfoController {

    private final SystemService systemService;

    public SystemInfoController(SystemService systemService) {
        this.systemService = systemService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        return ResponseEntity.ok(systemService.getSystemInfo());
    }
}
