package com.bridge.macbridge.service;

import com.bridge.macbridge.dto.FileItemDto;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.List;
import java.util.Set;
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
    
    public List<FileItemDto> listDirectoryDetailed(String directoryPath) {
        Path path = validatePath(directoryPath);
        File dir = path.toFile();
        if (!dir.exists() || !dir.isDirectory()) {
            throw new IllegalArgumentException("Directory does not exist at " + path);
        }
        try (Stream<Path> stream = Files.list(path)) {
            return stream.map(this::toFileItemDto).collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to list directory " + path, e);
        }
    }
    
    public FileItemDto getFileInfo(String filePath) {
        Path path = validatePath(filePath);
        File file = path.toFile();
        if (!file.exists()) {
            throw new IllegalArgumentException("File or directory does not exist at " + path);
        }
        return toFileItemDto(path);
    }
    
    public void deletePath(String pathStr) {
        Path path = validatePath(pathStr);
        try {
            FileSystemUtils.deleteRecursively(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete " + path, e);
        }
    }
    
    public void rename(String oldPathStr, String newName) {
        Path oldPath = validatePath(oldPathStr);
        Path newPath = oldPath.getParent().resolve(newName);
        // validate new path is still within base dir just to be safe
        validatePath(newPath.toString());
        try {
            Files.move(oldPath, newPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to rename " + oldPath, e);
        }
    }
    
    public void move(String sourceStr, String destStr) {
        Path source = validatePath(sourceStr);
        Path dest = validatePath(destStr);
        try {
            Files.move(source, dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to move " + source, e);
        }
    }
    
    public void copy(String sourceStr, String destStr) {
        Path source = validatePath(sourceStr);
        Path destDir = validatePath(destStr);
        try {
            if (Files.isDirectory(source)) {
                FileSystemUtils.copyRecursively(source, destDir.resolve(source.getFileName()));
            } else {
                Files.copy(source, destDir.resolve(source.getFileName()), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to copy " + source, e);
        }
    }
    
    public List<String> search(String directoryPath, String query) {
        Path dirPath = validatePath(directoryPath);
        try (Stream<Path> stream = Files.walk(dirPath)) {
            return stream
                    .filter(path -> path.getFileName().toString().contains(query))
                    .map(Path::toString)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Search failed", e);
        }
    }

    private FileItemDto toFileItemDto(Path path) {
        FileItemDto dto = new FileItemDto();
        dto.setName(path.getFileName() != null ? path.getFileName().toString() : "/");
        dto.setPath(path.toString());
        dto.setDirectory(Files.isDirectory(path));
        
        try {
            dto.setSize(Files.size(path));
            dto.setLastModified(Files.getLastModifiedTime(path).toMillis());
            
            // Get extension
            String name = dto.getName();
            int lastIdx = name.lastIndexOf('.');
            if (lastIdx > 0 && lastIdx < name.length() - 1 && !dto.isDirectory()) {
                dto.setExtension(name.substring(lastIdx + 1));
            } else {
                dto.setExtension("");
            }
            
            // Try get posix permissions if on Mac/Linux
            try {
                Set<PosixFilePermission> perms = Files.getPosixFilePermissions(path);
                dto.setPermissions(PosixFilePermissions.toString(perms));
            } catch (UnsupportedOperationException e) {
                // Windows fallback
                dto.setPermissions(Files.isReadable(path) ? "r" : "-" + 
                                   (Files.isWritable(path) ? "w" : "-") + 
                                   (Files.isExecutable(path) ? "x" : "-"));
            }
            
        } catch (IOException e) {
            // Ignore if we can't read attributes, keep defaults
        }
        return dto;
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
