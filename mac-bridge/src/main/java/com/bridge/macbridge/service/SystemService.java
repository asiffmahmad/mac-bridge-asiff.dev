package com.bridge.macbridge.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
    
    public Map<String, Object> getBatteryInfo() {
        Map<String, Object> info = new HashMap<>();
        try {
            String output = executeCommand("pmset -g batt");
            info.put("output", output);
            
            // Parse basic info if possible
            if (output.contains("InternalBattery")) {
                int percentIdx = output.indexOf("%");
                if (percentIdx > -1) {
                    int startIdx = output.lastIndexOf("\t", percentIdx);
                    if (startIdx == -1) startIdx = output.lastIndexOf(" ", percentIdx);
                    if (startIdx > -1) {
                        info.put("percentage", output.substring(startIdx + 1, percentIdx).trim());
                    }
                }
                info.put("isCharging", output.contains("AC Power"));
            }
        } catch (Exception e) {
            info.put("error", e.getMessage());
        }
        return info;
    }

    public List<Map<String, String>> getProcesses() {
        List<Map<String, String>> processes = new ArrayList<>();
        try {
            // ps -Ao pid,pcpu,pmem,comm -r | head -n 20 (Mac top CPU)
            String output = executeCommand("ps -Ao pid,pcpu,pmem,comm -r | head -n 21");
            String[] lines = output.split("\n");
            for (int i = 1; i < lines.length; i++) { // Skip header
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split("\\s+", 4);
                if (parts.length >= 4) {
                    Map<String, String> proc = new HashMap<>();
                    proc.put("pid", parts[0]);
                    proc.put("cpu", parts[1]);
                    proc.put("memory", parts[2]);
                    proc.put("command", parts[3]);
                    processes.add(proc);
                }
            }
        } catch (Exception e) {}
        return processes;
    }

    public List<Map<String, String>> getPorts() {
        List<Map<String, String>> ports = new ArrayList<>();
        try {
            // lsof -iTCP -sTCP:LISTEN -P -n
            String output = executeCommand("lsof -iTCP -sTCP:LISTEN -P -n");
            String[] lines = output.split("\n");
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split("\\s+");
                if (parts.length >= 9) {
                    Map<String, String> port = new HashMap<>();
                    port.put("command", parts[0]);
                    port.put("pid", parts[1]);
                    port.put("user", parts[2]);
                    
                    // Extract port from NAME col (e.g. *:8080 or 127.0.0.1:5000)
                    String name = parts[8];
                    int colonIdx = name.lastIndexOf(':');
                    if (colonIdx > -1) {
                        port.put("port", name.substring(colonIdx + 1));
                    } else {
                        port.put("port", name);
                    }
                    ports.add(port);
                }
            }
        } catch (Exception e) {}
        return ports;
    }

    public Map<String, String> getToolVersions() {
        Map<String, String> versions = new HashMap<>();
        versions.put("java", System.getProperty("java.version"));
        
        try { versions.put("node", executeCommand("node -v").trim()); } catch (Exception e) { versions.put("node", "Not installed"); }
        try { versions.put("npm", executeCommand("npm -v").trim()); } catch (Exception e) { versions.put("npm", "Not installed"); }
        try { versions.put("python", executeCommand("python3 --version").replace("Python ", "").trim()); } catch (Exception e) { versions.put("python", "Not installed"); }
        try { versions.put("git", executeCommand("git --version").replace("git version ", "").trim()); } catch (Exception e) { versions.put("git", "Not installed"); }
        try { versions.put("maven", extractVersion(executeCommand("mvn -v"), "Apache Maven")); } catch (Exception e) { versions.put("maven", "Not installed"); }
        
        return versions;
    }

    private String extractVersion(String output, String prefix) {
        for (String line : output.split("\n")) {
            if (line.startsWith(prefix)) {
                return line.replace(prefix, "").trim().split(" ")[0]; // just get the number part
            }
        }
        return "Unknown";
    }
    
    public Map<String, Object> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("bridgeStatus", "Online");
        health.put("os", System.getProperty("os.name") + " " + System.getProperty("os.version"));
        health.put("java", System.getProperty("java.version"));
        return health;
    }

    private String getHostname() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown";
        }
    }

    private String executeCommand(String command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder("bash", "-c", command);
        Process p = pb.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        p.waitFor();
        return sb.toString();
    }
}
