package com.bridge.macbridge.dto;

public class PairingResponse {
    private String token;
    private String refreshToken;
    private String deviceId;
    private String bridgeId;   // Used by the phone for zero-config URL discovery

    public PairingResponse(String token, String refreshToken, String deviceId, String bridgeId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.deviceId = deviceId;
        this.bridgeId = bridgeId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getBridgeId() { return bridgeId; }
    public void setBridgeId(String bridgeId) { this.bridgeId = bridgeId; }
}
