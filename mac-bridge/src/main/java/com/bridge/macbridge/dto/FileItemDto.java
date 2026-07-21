package com.bridge.macbridge.dto;

public class FileItemDto {
    private String name;
    private String path;
    private boolean isDirectory;
    private long size;
    private long lastModified;
    private String permissions;
    private String extension;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    
    public boolean isDirectory() { return isDirectory; }
    public void setDirectory(boolean isDirectory) { this.isDirectory = isDirectory; }
    
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }
    
    public long getLastModified() { return lastModified; }
    public void setLastModified(long lastModified) { this.lastModified = lastModified; }
    
    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }
    
    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
}
