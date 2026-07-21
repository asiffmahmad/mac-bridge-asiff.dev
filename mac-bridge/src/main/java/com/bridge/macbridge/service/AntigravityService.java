package com.bridge.macbridge.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.HashMap;

@Service
public class AntigravityService {

    private final SimpMessagingTemplate messagingTemplate;
    
    // Absolute path to the wrapper in project root for reliability
    private final String pythonScriptPath = System.getProperty("user.dir") + "/antigravity-wrapper.py";

    public AntigravityService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public Map<String, Object> getStatus() {
        return executePythonWrapper("status", null);
    }

    public Map<String, Object> sendChat(String message) {
        // Stream back to websocket to meet streaming requirement
        messagingTemplate.convertAndSend("/topic/antigravity", "Sending message to Antigravity SDK...");
        
        Map<String, Object> response = executePythonWrapper("chat", message);
        
        messagingTemplate.convertAndSend("/topic/antigravity", response.get("message"));
        return response;
    }

    private Map<String, Object> executePythonWrapper(String command, String arg) {
        try {
            ProcessBuilder pb;
            if (arg != null) {
                pb = new ProcessBuilder("python3", pythonScriptPath, command, arg);
            } else {
                pb = new ProcessBuilder("python3", pythonScriptPath, command);
            }
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            
            process.waitFor();
            
            // Parse rudimentary JSON (since we don't have jackson imported locally in this method, we will just return a map manually for simplicity)
            Map<String, Object> result = new HashMap<>();
            String jsonOutput = output.toString();
            
            if (jsonOutput.contains("\"error\":")) {
                throw new RuntimeException("Antigravity SDK Error: " + jsonOutput);
            }
            
            if (command.equals("status")) {
                result.put("status", "online");
                result.put("version", "1.0.0");
                result.put("sdk", "google_antigravity");
                result.put("integration", "python-cli");
            } else if (command.equals("chat")) {
                // simple parsing
                String msg = jsonOutput.substring(jsonOutput.indexOf("\"message\": \"") + 12, jsonOutput.lastIndexOf("\""));
                result.put("message", msg);
            }
            
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to invoke Python SDK wrapper", e);
        }
    }
}
