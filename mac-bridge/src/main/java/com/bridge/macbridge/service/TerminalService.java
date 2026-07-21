package com.bridge.macbridge.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;

@Service
public class TerminalService {

    private final SimpMessagingTemplate messagingTemplate;

    // Expanded whitelist as per requirements
    private static final List<String> ALLOWED_COMMANDS = Arrays.asList(
            "pwd", "ls", "echo", "java -version", "whoami", "mvn -version", "git status", "git branch", "git log"
    );

    public TerminalService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public String executeCommand(String command) {
        validateCommand(command);

        try {
            ProcessBuilder processBuilder = new ProcessBuilder();
            processBuilder.command("bash", "-c", command);
            processBuilder.redirectErrorStream(true);
            
            Process process = processBuilder.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                // Stream line by line to WebSocket for real-time frontend updates
                messagingTemplate.convertAndSend("/topic/terminal", line);
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                return output.toString() + "\n(Command exited with code " + exitCode + ")";
            }
            
            return output.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error executing command: " + e.getMessage(), e);
        }
    }

    private void validateCommand(String command) {
        if (command == null || command.trim().isEmpty()) {
            throw new IllegalArgumentException("Command cannot be empty");
        }
        
        // Anti-injection check
        if (command.contains(";") || command.contains("&&") || command.contains("|") || command.contains(">") || command.contains("<") || command.contains("`") || command.contains("$(")) {
            throw new SecurityException("Command chaining and redirection are not allowed");
        }

        // Whitelist check
        boolean isAllowed = ALLOWED_COMMANDS.stream().anyMatch(allowed -> command.trim().startsWith(allowed));
        if (!isAllowed) {
            throw new SecurityException("Command not allowed by bridge policy");
        }
    }
}
