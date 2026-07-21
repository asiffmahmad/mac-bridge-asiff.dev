package com.bridge.macbridge.service;

import com.bridge.macbridge.dto.ChatMessageDto;
import com.bridge.macbridge.dto.ChatSessionDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AntigravityService {

    private final SimpMessagingTemplate messagingTemplate;
    
    private final String pythonScriptPath = System.getProperty("user.dir") + "/antigravity-wrapper.py";
    private final String sessionsDir = System.getProperty("user.home") + "/.mac-bridge/chats";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();

    public AntigravityService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(sessionsDir));
        } catch (IOException e) {
            System.err.println("Failed to create chat sessions directory");
        }
    }

    public List<ChatSessionDto> getSessions() {
        List<ChatSessionDto> sessions = new ArrayList<>();
        File dir = new File(sessionsDir);
        File[] files = dir.listFiles((d, name) -> name.endsWith(".json"));
        if (files != null) {
            for (File file : files) {
                try {
                    Map<String, Object> data = objectMapper.readValue(file, new TypeReference<Map<String, Object>>() {});
                    ChatSessionDto dto = new ChatSessionDto();
                    dto.setId((String) data.get("id"));
                    dto.setTitle((String) data.get("title"));
                    dto.setCreatedAt(((Number) data.get("createdAt")).longValue());
                    dto.setUpdatedAt(((Number) data.get("updatedAt")).longValue());
                    sessions.add(dto);
                } catch (Exception e) {}
            }
        }
        sessions.sort((a, b) -> Long.compare(b.getUpdatedAt(), a.getUpdatedAt()));
        return sessions;
    }

    public List<ChatMessageDto> getSessionHistory(String sessionId) {
        try {
            File file = new File(sessionsDir + "/" + sessionId + ".json");
            if (file.exists()) {
                Map<String, Object> data = objectMapper.readValue(file, new TypeReference<Map<String, Object>>() {});
                List<Map<String, String>> rawMsgs = (List<Map<String, String>>) data.get("messages");
                List<ChatMessageDto> messages = new ArrayList<>();
                for (Map<String, String> m : rawMsgs) {
                    messages.add(new ChatMessageDto(m.get("role"), m.get("content")));
                }
                return messages;
            }
        } catch (Exception e) {}
        return new ArrayList<>();
    }

    public void deleteSession(String sessionId) {
        File file = new File(sessionsDir + "/" + sessionId + ".json");
        if (file.exists()) {
            file.delete();
        }
    }

    public void cancelRequest(String sessionId) {
        Process p = activeProcesses.get(sessionId);
        if (p != null && p.isAlive()) {
            p.destroy();
            activeProcesses.remove(sessionId);
        }
    }

    public Map<String, Object> sendChat(String sessionId, String message) {
        String id = (sessionId != null && !sessionId.isBlank()) ? sessionId : UUID.randomUUID().toString();
        
        List<ChatMessageDto> history = getSessionHistory(id);
        history.add(new ChatMessageDto("user", message));
        
        String title = history.size() == 1 ? message.substring(0, Math.min(message.length(), 30)) : null;
        saveSession(id, title, history);
        
        String topic = "/topic/antigravity/" + id;
        
        try {
            // Simulated execution with the python wrapper for MVP
            String pythonBin = System.getProperty("user.dir") + "/venv/bin/python";
            ProcessBuilder pb = new ProcessBuilder(pythonBin, pythonScriptPath, "chat", message);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            activeProcesses.put(id, process);
            
            InputStreamReader reader = new InputStreamReader(process.getInputStream());
            StringBuilder output = new StringBuilder();
            
            messagingTemplate.convertAndSend(topic, "{\"type\": \"start\"}");
            
            char[] buffer = new char[1024];
            int numRead;
            while ((numRead = reader.read(buffer)) != -1) {
                String token = new String(buffer, 0, numRead);
                output.append(token);
                messagingTemplate.convertAndSend(topic, "{\"type\": \"token\", \"content\": " + objectMapper.writeValueAsString(token) + "}");
            }
            
            int exitCode = process.waitFor();
            activeProcesses.remove(id);
            
            String finalResponse;
            if (exitCode != 0) {
                finalResponse = "Error: Process exited with code " + exitCode + "\n" + output.toString();
            } else {
                finalResponse = output.toString();
            }
            
            history.add(new ChatMessageDto("assistant", finalResponse));
            saveSession(id, null, history);
            
            messagingTemplate.convertAndSend(topic, "{\"type\": \"end\"}");
            
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", id);
            result.put("message", finalResponse);
            return result;
            
        } catch (InterruptedException e) {
            history.add(new ChatMessageDto("assistant", "(Cancelled by user)"));
            saveSession(id, null, history);
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", id);
            result.put("message", "(Cancelled by user)");
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to invoke Antigravity SDK", e);
        }
    }

    private void saveSession(String id, String newTitle, List<ChatMessageDto> messages) {
        try {
            File file = new File(sessionsDir + "/" + id + ".json");
            Map<String, Object> data = new HashMap<>();
            long now = System.currentTimeMillis();
            
            if (file.exists()) {
                data = objectMapper.readValue(file, new TypeReference<Map<String, Object>>() {});
                data.put("updatedAt", now);
                if (newTitle != null && !data.containsKey("title")) {
                    data.put("title", newTitle);
                }
            } else {
                data.put("id", id);
                data.put("title", newTitle != null ? newTitle : "New Chat");
                data.put("createdAt", now);
                data.put("updatedAt", now);
            }
            
            data.put("messages", messages);
            objectMapper.writeValue(file, data);
        } catch (Exception e) {
            System.err.println("Failed to save chat session");
        }
    }
}
