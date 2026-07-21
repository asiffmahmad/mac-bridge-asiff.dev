package com.bridge.macbridge.dto;

import java.util.List;

public class GitStatusDto {
    private String branch;
    private List<String> staged;
    private List<String> modified;
    private List<String> untracked;

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    
    public List<String> getStaged() { return staged; }
    public void setStaged(List<String> staged) { this.staged = staged; }
    
    public List<String> getModified() { return modified; }
    public void setModified(List<String> modified) { this.modified = modified; }
    
    public List<String> getUntracked() { return untracked; }
    public void setUntracked(List<String> untracked) { this.untracked = untracked; }
}
