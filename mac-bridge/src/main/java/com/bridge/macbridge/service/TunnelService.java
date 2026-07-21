package com.bridge.macbridge.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TunnelService {

    public Map<String, Object> getNetworkInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("localIps", getLocalIpAddresses());
        info.put("cloudflared", checkProcess("cloudflared"));
        info.put("tailscale", checkProcess("tailscaled") || checkProcess("Tailscale"));
        info.put("ngrok", checkProcess("ngrok"));
        return info;
    }

    private List<String> getLocalIpAddresses() {
        List<String> ips = new ArrayList<>();
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (networkInterface.isLoopback() || !networkInterface.isUp()) {
                    continue; // Skip loopback and disabled interfaces
                }

                Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress address = addresses.nextElement();
                    // IPv4 only for simpler URLs for now
                    if (address.getHostAddress().contains(".")) {
                        ips.add(address.getHostAddress());
                    }
                }
            }
        } catch (Exception e) {
            // Log silently
        }
        return ips;
    }

    private boolean checkProcess(String processName) {
        try {
            ProcessBuilder pb = new ProcessBuilder("pgrep", "-f", processName);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line = reader.readLine();
            process.waitFor();
            return line != null && !line.trim().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
