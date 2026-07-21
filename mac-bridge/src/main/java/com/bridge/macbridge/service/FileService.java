package com.bridge.macbridge.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FileService {

    // MVP constraint: only allow access inside the user's home directory to prevent traversal attacks to root
    private final String baseDir = System.getProperty("user.home");

    public void createFolder(String folderPath) {
        Path path = validatePath(folderPath);
        File folder = path.toFile();
        if (!folder.exists()) {
            boolean created = folder.mkdirs();
            if (!created) {
                throw new RuntimeException("Failed to create folder at " + path);
            }
        } else {
            throw new IllegalArgumentException("Folder already exists at " + path);
        }
    }

    public void writeToFile(String filePath, String content) {
        Path path = validatePath(filePath);
        try {
            Files.writeString(path, content);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write to file " + path, e);
        }
    }

    public String readFile(String filePath) {
        Path path = validatePath(filePath);
        File file = path.toFile();
        if (!file.exists() || !file.isFile()) {
            throw new IllegalArgumentException("File does not exist at " + path);
        }
        try {
            return Files.readString(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file " + path, e);
        }
    }

    public List<String> listDirectory(String directoryPath) {
        Path path = validatePath(directoryPath);
        File dir = path.toFile();
        if (!dir.exists() || !dir.isDirectory()) {
            throw new IllegalArgumentException("Directory does not exist at " + path);
        }
        try (Stream<Path> stream = Files.list(path)) {
            return stream.map(p -> p.getFileName().toString() + (Files.isDirectory(p) ? "/" : ""))
                         .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to list directory " + path, e);
        }
    }

    private Path validatePath(String requestedPath) {
        if (requestedPath == null || requestedPath.trim().isEmpty()) {
            throw new IllegalArgumentException("Path cannot be empty");
        }
        
        // Handle ~ shorthand
        if (requestedPath.startsWith("~/")) {
            requestedPath = baseDir + requestedPath.substring(1);
        } else if (requestedPath.equals("~")) {
            requestedPath = baseDir;
        }
        
        Path normalizedPath = Paths.get(requestedPath).normalize().toAbsolutePath();
        if (!normalizedPath.startsWith(Paths.get(baseDir).normalize().toAbsolutePath())) {
            throw new SecurityException("Path traversal attempt blocked. Access is restricted to user home directory.");
        }
        
        return normalizedPath;
    }
}
