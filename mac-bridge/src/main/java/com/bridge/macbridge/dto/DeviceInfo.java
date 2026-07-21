package com.bridge.macbridge.dto;

public class DeviceInfo {
    private String id;
    private String name;
    private long pairedAt;
    private long lastSeen;

    public DeviceInfo() {}

    public DeviceInfo(String id, String name, long pairedAt, long lastSeen) {
        this.id = id;
        this.name = name;
        this.pairedAt = pairedAt;
        this.lastSeen = lastSeen;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public long getPairedAt() { return pairedAt; }
    public void setPairedAt(long pairedAt) { this.pairedAt = pairedAt; }
    
    public long getLastSeen() { return lastSeen; }
    public void setLastSeen(long lastSeen) { this.lastSeen = lastSeen; }
}
