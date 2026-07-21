package com.bridge.macbridge.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TerminalService {

    private final SimpMessagingTemplate messagingTemplate;

    @Value("${bridge.terminal.mode:SAFE}")
    private String terminalMode; // "SAFE" or "FULL"

    private static final List<String> ALLOWED_COMMANDS = Arrays.asList(
            "pwd", "ls", "echo", "java", "whoami", "mvn", "git", "cat", "tail", "head", "grep", "find", "top", "pmset"
    );

    // Map of sessionId -> Process
    private final Map<String, Process> activeSessions = new ConcurrentHashMap<>();
    
    // Command history
    private final List<String> history = new java.util.concurrent.CopyOnWriteArrayList<>();

    public TerminalService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public String executeCommand(String command, String cwd, String sessionId) {
        validateCommand(command);
        
        String actualSessionId = (sessionId != null && !sessionId.isBlank()) ? sessionId : UUID.randomUUID().toString();
        history.add(command);

        try {
            ProcessBuilder processBuilder = new ProcessBuilder();
            // Use bash -c to run the command
            processBuilder.command("bash", "-c", command);
            processBuilder.redirectErrorStream(true);
            
            if (cwd != null && !cwd.isBlank()) {
                File dir = new File(cwd);
                if (dir.exists() && dir.isDirectory()) {
                    processBuilder.directory(dir);
                }
            }
            
            Process process = processBuilder.start();
            activeSessions.put(actualSessionId, process);
            
            // Start reading output in a separate thread so this method can block until finish or return immediately if desired.
            // For REST + WebSocket combo, we usually return immediately with the sessionId, or block and return full string while also streaming.
            // Let's block and stream for simplicity, like the original code, but support interruption.
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                // Stream line by line to WebSocket on a specific topic if session provided, else broadcast
                String topic = "/topic/terminal" + (sessionId != null ? "/" + sessionId : "");
                messagingTemplate.convertAndSend(topic, line);
            }
            
            int exitCode = process.waitFor();
            activeSessions.remove(actualSessionId);
            
            if (exitCode != 0) {
                return output.toString() + "\n(Command exited with code " + exitCode + ")";
            }
            
            return output.toString();
        } catch (InterruptedException e) {
            activeSessions.remove(actualSessionId);
            return "(Command interrupted)";
        } catch (Exception e) {
            activeSessions.remove(actualSessionId);
            throw new RuntimeException("Error executing command: " + e.getMessage(), e);
        }
    }

    public boolean interruptSession(String sessionId) {
        Process process = activeSessions.get(sessionId);
        if (process != null && process.isAlive()) {
            process.destroy(); // SIGTERM
            activeSessions.remove(sessionId);
            return true;
        }
        return false;
    }

    public List<String> getHistory() {
        return history;
    }

    private void validateCommand(String command) {
        if (command == null || command.trim().isEmpty()) {
            throw new IllegalArgumentException("Command cannot be empty");
        }

        if ("FULL".equalsIgnoreCase(terminalMode)) {
            return; // All commands allowed
        }
        
        // SAFE mode validation
        // Anti-injection check
        if (command.contains(";") || command.contains("&&") || command.contains("|") || command.contains(">") || command.contains("<") || command.contains("`") || command.contains("$(")) {
            throw new SecurityException("Command chaining and redirection are not allowed in SAFE mode");
        }

        // Whitelist check
        boolean isAllowed = ALLOWED_COMMANDS.stream().anyMatch(allowed -> command.trim().startsWith(allowed));
        if (!isAllowed) {
            throw new SecurityException("Command not allowed by bridge policy in SAFE mode");
        }
    }
}
