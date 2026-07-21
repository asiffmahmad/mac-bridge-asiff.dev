package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class WriteFileRequest {
    @NotBlank(message = "Path is required")
    private String path;

    @NotBlank(message = "Content is required")
    private String content;

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
