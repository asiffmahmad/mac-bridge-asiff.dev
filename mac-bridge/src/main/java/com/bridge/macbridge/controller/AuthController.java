package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.AuthRequest;
import com.bridge.macbridge.dto.AuthResponse;
import com.bridge.macbridge.dto.RefreshRequest;
import com.bridge.macbridge.security.JwtUtil;
import com.bridge.macbridge.service.BridgeDiscoveryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final BridgeDiscoveryService discoveryService;

    @Value("${bridge.version:1.0.0}")
    private String version;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                          UserDetailsService userDetailsService, BridgeDiscoveryService discoveryService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.discoveryService = discoveryService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(userDetails.getUsername(), authRequest.getDeviceId());
        String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), authRequest.getDeviceId());

        return ResponseEntity.ok(new AuthResponse(jwt, refreshToken, getHostname(), version, discoveryService.getBridgeId()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest refreshRequest) {
        String refreshToken = refreshRequest.getRefreshToken();

        try {
            if (!jwtUtil.isRefreshToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token type");
            }

            String username = jwtUtil.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(refreshToken, userDetails)) {
                String deviceId = jwtUtil.extractDeviceId(refreshToken);
                String newJwt = jwtUtil.generateToken(username, deviceId);
                String newRefreshToken = jwtUtil.generateRefreshToken(username, deviceId);

                return ResponseEntity.ok(new AuthResponse(newJwt, newRefreshToken, getHostname(), version, discoveryService.getBridgeId()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown Mac";
        }
    }
}
