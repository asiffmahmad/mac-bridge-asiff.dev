package com.bridge.macbridge.service;

import com.bridge.macbridge.dto.DeviceInfo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PairingService {

    @Value("${bridge.pairing.enabled:true}")
    private boolean pairingEnabled;

    @Value("${bridge.pairing.code-ttl-seconds:300}")
    private long codeTtlSeconds;

    @Value("${bridge.devices.file:#{systemProperties['user.home']}/.mac-bridge/devices.json}")
    private String devicesFilePath;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Long> pairingCodes = new ConcurrentHashMap<>();
    private List<DeviceInfo> trustedDevices = new ArrayList<>();

    @PostConstruct
    public void init() {
        loadTrustedDevices();
    }

    private void loadTrustedDevices() {
        Path path = Paths.get(devicesFilePath);
        try {
            if (Files.exists(path)) {
                trustedDevices = objectMapper.readValue(path.toFile(), new TypeReference<List<DeviceInfo>>() {});
            } else {
                Files.createDirectories(path.getParent());
                saveTrustedDevices();
            }
        } catch (IOException e) {
            System.err.println("[Mac Bridge] Error loading devices file: " + e.getMessage());
        }
    }

    private void saveTrustedDevices() {
        try {
            objectMapper.writeValue(new File(devicesFilePath), trustedDevices);
        } catch (IOException e) {
            System.err.println("[Mac Bridge] Error saving devices file: " + e.getMessage());
        }
    }

    public String generatePairingCode() {
        if (!pairingEnabled) {
            throw new IllegalStateException("Pairing is disabled");
        }
        
        // Generate a 6-digit code
        String code = String.format("%06d", (int)(Math.random() * 1000000));
        long expiresAt = System.currentTimeMillis() + (codeTtlSeconds * 1000);
        
        pairingCodes.put(code, expiresAt);
        
        // Cleanup expired codes
        pairingCodes.entrySet().removeIf(entry -> entry.getValue() < System.currentTimeMillis());
        
        return code;
    }

    public DeviceInfo pairDevice(String code, String deviceName) {
        if (!pairingEnabled) {
            throw new IllegalStateException("Pairing is disabled");
        }
        
        Long expiresAt = pairingCodes.get(code);
        if (expiresAt == null || expiresAt < System.currentTimeMillis()) {
            pairingCodes.remove(code); // Cleanup if expired
            throw new IllegalArgumentException("Invalid or expired pairing code");
        }
        
        // Valid code, consume it
        pairingCodes.remove(code);
        
        // Register device
        String deviceId = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        
        DeviceInfo newDevice = new DeviceInfo(deviceId, deviceName, now, now);
        trustedDevices.add(newDevice);
        saveTrustedDevices();
        
        return newDevice;
    }

    public List<DeviceInfo> getTrustedDevices() {
        return new ArrayList<>(trustedDevices);
    }

    public void removeDevice(String deviceId) {
        trustedDevices.removeIf(d -> d.getId().equals(deviceId));
        saveTrustedDevices();
    }

    public void updateDeviceLastSeen(String deviceId) {
        for (DeviceInfo device : trustedDevices) {
            if (device.getId().equals(deviceId)) {
                device.setLastSeen(System.currentTimeMillis());
                saveTrustedDevices(); // Could throttle this if it happens too often
                break;
            }
        }
    }
    
    public boolean isDeviceTrusted(String deviceId) {
        return trustedDevices.stream().anyMatch(d -> d.getId().equals(deviceId));
    }
}
