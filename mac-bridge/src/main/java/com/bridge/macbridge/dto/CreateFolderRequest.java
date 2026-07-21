package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateFolderRequest {
    @NotBlank(message = "Path is required")
    private String path;

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
