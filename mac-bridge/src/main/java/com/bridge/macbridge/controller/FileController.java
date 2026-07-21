package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.CreateFolderRequest;
import com.bridge.macbridge.dto.FileItemDto;
import com.bridge.macbridge.dto.PathPairRequest;
import com.bridge.macbridge.dto.RenameFileRequest;
import com.bridge.macbridge.dto.WriteFileRequest;
import com.bridge.macbridge.service.FileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    
    @GetMapping("/list-detailed")
    public ResponseEntity<List<FileItemDto>> listDirectoryDetailed(@RequestParam String path) {
        return ResponseEntity.ok(fileService.listDirectoryDetailed(path));
    }
    
    @GetMapping("/info")
    public ResponseEntity<FileItemDto> getFileInfo(@RequestParam String path) {
        return ResponseEntity.ok(fileService.getFileInfo(path));
    }
    
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteFile(@RequestParam String path) {
        fileService.deletePath(path);
        return ResponseEntity.ok("Deleted successfully");
    }
    
    @PostMapping("/rename")
    public ResponseEntity<String> renameFile(@Valid @RequestBody RenameFileRequest request) {
        fileService.rename(request.getPath(), request.getNewName());
        return ResponseEntity.ok("Renamed successfully");
    }
    
    @PostMapping("/move")
    public ResponseEntity<String> moveFile(@Valid @RequestBody PathPairRequest request) {
        fileService.move(request.getSource(), request.getDest());
        return ResponseEntity.ok("Moved successfully");
    }
    
    @PostMapping("/copy")
    public ResponseEntity<String> copyFile(@Valid @RequestBody PathPairRequest request) {
        fileService.copy(request.getSource(), request.getDest());
        return ResponseEntity.ok("Copied successfully");
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<String>> searchFiles(@RequestParam String dir, @RequestParam String query) {
        return ResponseEntity.ok(fileService.search(dir, query));
    }
}
