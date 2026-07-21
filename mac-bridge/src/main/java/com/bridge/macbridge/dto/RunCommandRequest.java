package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class RunCommandRequest {
    @NotBlank(message = "Command cannot be empty")
    private String command;
    private String cwd;
    private String sessionId;

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }
    
    public String getCwd() { return cwd; }
    public void setCwd(String cwd) { this.cwd = cwd; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}
