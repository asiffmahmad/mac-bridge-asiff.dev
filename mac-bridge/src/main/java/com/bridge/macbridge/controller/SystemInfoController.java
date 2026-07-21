package com.bridge.macbridge.controller;

import com.bridge.macbridge.service.SystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
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
    
    @GetMapping("/battery")
    public ResponseEntity<Map<String, Object>> getBatteryInfo() {
        return ResponseEntity.ok(systemService.getBatteryInfo());
    }
    
    @GetMapping("/processes")
    public ResponseEntity<List<Map<String, String>>> getProcesses() {
        return ResponseEntity.ok(systemService.getProcesses());
    }
    
    @GetMapping("/ports")
    public ResponseEntity<List<Map<String, String>>> getPorts() {
        return ResponseEntity.ok(systemService.getPorts());
    }
    
    @GetMapping("/versions")
    public ResponseEntity<Map<String, String>> getVersions() {
        return ResponseEntity.ok(systemService.getToolVersions());
    }
}
