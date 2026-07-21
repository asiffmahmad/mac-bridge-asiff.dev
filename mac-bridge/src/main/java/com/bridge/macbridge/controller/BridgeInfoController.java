package com.bridge.macbridge.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bridge")
public class BridgeInfoController {

    @Value("${bridge.version:1.0.0}")
    private String version;

    @Value("${bridge.pairing.enabled:true}")
    private boolean pairingEnabled;

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("hostname", getHostname());
        info.put("version", version);
        info.put("os", System.getProperty("os.name") + " " + System.getProperty("os.version"));
        info.put("pairingEnabled", pairingEnabled);
        info.put("status", "Online");
        
        return ResponseEntity.ok(info);
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown Mac";
        }
    }
}
