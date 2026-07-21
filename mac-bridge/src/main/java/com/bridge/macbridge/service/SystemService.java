package com.bridge.macbridge.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;
import java.util.HashMap;
import java.util.Map;

@Service
public class SystemService {

    public Map<String, Object> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);
        
        info.put("os", System.getProperty("os.name"));
        info.put("hostname", getHostname());
        info.put("currentUser", System.getProperty("user.name"));
        info.put("cpuCores", Runtime.getRuntime().availableProcessors());
        info.put("systemLoadAverage", osBean.getSystemLoadAverage());
        info.put("totalMemoryBytes", osBean.getTotalMemorySize());
        info.put("freeMemoryBytes", osBean.getFreeMemorySize());
        
        File root = new File("/");
        info.put("totalDiskSpaceBytes", root.getTotalSpace());
        info.put("freeDiskSpaceBytes", root.getFreeSpace());
        
        return info;
    }
    
    public Map<String, Object> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("bridgeStatus", "Online");
        health.put("os", System.getProperty("os.name") + " " + System.getProperty("os.version"));
        health.put("java", System.getProperty("java.version"));
        // Check Antigravity locally by checking if Python SDK wrapper is executable
        File wrapper = new File(System.getProperty("user.dir") + "/antigravity-wrapper.py");
        health.put("antigravityStatus", wrapper.exists() && wrapper.canExecute() ? "Detected (Python SDK Wrapper)" : "Not Found");
        health.put("selectedIntegration", wrapper.exists() ? "python-cli" : "none");
        
        return health;
    }

    private String getHostname() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
