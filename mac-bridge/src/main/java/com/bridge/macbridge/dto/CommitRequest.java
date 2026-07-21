package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class CommitRequest {
    @NotBlank
    private String repoPath;
    @NotBlank
    private String message;
    
    public String getRepoPath() { return repoPath; }
    public void setRepoPath(String repoPath) { this.repoPath = repoPath; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
