package com.bridge.macbridge.controller;

import com.bridge.macbridge.service.BridgeDiscoveryService;
import com.bridge.macbridge.service.CloudflaredService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Exposes tunnel status and control endpoints to the frontend.
 */
@RestController
@RequestMapping("/api/tunnel")
public class TunnelController {

    private final CloudflaredService cloudflaredService;
    private final BridgeDiscoveryService discoveryService;

    public TunnelController(CloudflaredService cloudflaredService, BridgeDiscoveryService discoveryService) {
        this.cloudflaredService = cloudflaredService;
        this.discoveryService = discoveryService;
    }

    /** Get the current status of the Cloudflare tunnel. */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("running", cloudflaredService.isRunning());
        status.put("binaryPresent", cloudflaredService.isBinaryPresent());
        status.put("downloading", cloudflaredService.isDownloading());
        status.put("tunnelUrl", cloudflaredService.getTunnelUrl());
        status.put("bridgeId", discoveryService.getBridgeId());
        return ResponseEntity.ok(status);
    }

    /** Restart the Cloudflare tunnel. */
    @PostMapping("/restart")
    public ResponseEntity<Map<String, String>> restart() {
        cloudflaredService.restartTunnel();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Tunnel restart initiated. New URL will appear shortly.");
        return ResponseEntity.ok(response);
    }

    /** Download cloudflared binary if missing. */
    @PostMapping("/install")
    public ResponseEntity<Map<String, String>> install() {
        if (cloudflaredService.isBinaryPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "cloudflared binary is already present.");
            return ResponseEntity.ok(response);
        }
        new Thread(() -> {
            cloudflaredService.downloadCloudflared();
            cloudflaredService.startTunnel();
        }, "cloudflared-installer").start();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Download started. Check /api/tunnel/status for progress.");
        return ResponseEntity.accepted().body(response);
    }
}
