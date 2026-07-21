package com.bridge.macbridge.dto;

public class PairingResponse {
    private String token;
    private String refreshToken;
    private String deviceId;

    public PairingResponse(String token, String refreshToken, String deviceId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.deviceId = deviceId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
