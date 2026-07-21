package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class PairingRequest {
    @NotBlank(message = "Pairing code is required")
    private String code;
    
    @NotBlank(message = "Device name is required")
    private String deviceName;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
}
