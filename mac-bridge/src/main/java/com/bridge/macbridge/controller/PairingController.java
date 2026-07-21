package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.DeviceInfo;
import com.bridge.macbridge.dto.PairingRequest;
import com.bridge.macbridge.dto.PairingResponse;
import com.bridge.macbridge.security.JwtUtil;
import com.bridge.macbridge.service.PairingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pairing")
public class PairingController {

    private final PairingService pairingService;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public PairingController(PairingService pairingService, JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.pairingService = pairingService;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Called from the Mac (or by an admin) to generate a pairing code for a new device.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateCode() {
        try {
            String code = pairingService.generatePairingCode();
            Map<String, String> response = new HashMap<>();
            response.put("code", code);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    /**
     * Called from the Phone to verify the pairing code and register the device.
     * Returns a JWT and Refresh Token just like a login.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyCode(@Valid @RequestBody PairingRequest request) {
        try {
            DeviceInfo device = pairingService.pairDevice(request.getCode(), request.getDeviceName());
            
            // Generate tokens for this new device (using admin user as default owner)
            String username = "admin";
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            String jwt = jwtUtil.generateToken(userDetails.getUsername(), device.getId());
            String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), device.getId());
            
            return ResponseEntity.ok(new PairingResponse(jwt, refreshToken, device.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    /**
     * List all trusted devices. (Requires Authentication)
     */
    @GetMapping("/devices")
    public ResponseEntity<List<DeviceInfo>> getDevices() {
        return ResponseEntity.ok(pairingService.getTrustedDevices());
    }

    /**
     * Remove a trusted device. (Requires Authentication)
     */
    @DeleteMapping("/devices/{id}")
    public ResponseEntity<?> removeDevice(@PathVariable String id) {
        pairingService.removeDevice(id);
        return ResponseEntity.ok("Device removed");
    }
}
