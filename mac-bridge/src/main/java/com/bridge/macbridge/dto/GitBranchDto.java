package com.bridge.macbridge.dto;

public class GitBranchDto {
    private String name;
    private boolean current;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public boolean isCurrent() { return current; }
    public void setCurrent(boolean current) { this.current = current; }
}
