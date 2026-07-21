package com.bridge.macbridge.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String hostname;
    private String version;
    private String bridgeId;  // Allows phone to store once and auto-discover on reconnect

    public AuthResponse(String token, String refreshToken, String hostname, String version, String bridgeId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.hostname = hostname;
        this.version = version;
        this.bridgeId = bridgeId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getBridgeId() { return bridgeId; }
    public void setBridgeId(String bridgeId) { this.bridgeId = bridgeId; }
}
