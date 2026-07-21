package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class PathPairRequest {
    @NotBlank
    private String source;
    @NotBlank
    private String dest;
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getDest() { return dest; }
    public void setDest(String dest) { this.dest = dest; }
}
