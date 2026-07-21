package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.CreateFolderRequest;
import com.bridge.macbridge.dto.WriteFileRequest;
import com.bridge.macbridge.service.FileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/create-folder")
    public ResponseEntity<String> createFolder(@Valid @RequestBody CreateFolderRequest request) {
        fileService.createFolder(request.getPath());
        return ResponseEntity.ok("Folder created successfully");
    }

    @PostMapping("/write")
    public ResponseEntity<String> writeFile(@Valid @RequestBody WriteFileRequest request) {
        fileService.writeToFile(request.getPath(), request.getContent());
        return ResponseEntity.ok("File written successfully");
    }

    @GetMapping("/read")
    public ResponseEntity<String> readFile(@RequestParam String path) {
        String content = fileService.readFile(path);
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/list")
    public ResponseEntity<List<String>> listDirectory(@RequestParam String path) {
        List<String> files = fileService.listDirectory(path);
        return ResponseEntity.ok(files);
    }
}
