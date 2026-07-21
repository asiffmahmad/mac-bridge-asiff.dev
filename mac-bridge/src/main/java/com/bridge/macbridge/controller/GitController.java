package com.bridge.macbridge.controller;

import com.bridge.macbridge.dto.CommitRequest;
import com.bridge.macbridge.dto.GitBranchDto;
import com.bridge.macbridge.dto.GitCommitDto;
import com.bridge.macbridge.dto.GitStatusDto;
import com.bridge.macbridge.service.GitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/git")
public class GitController {

    private final GitService gitService;

    public GitController(GitService gitService) {
        this.gitService = gitService;
    }

    @GetMapping("/status")
    public ResponseEntity<GitStatusDto> getStatus(@RequestParam String path) {
        return ResponseEntity.ok(gitService.getStatus(path));
    }

    @GetMapping("/log")
    public ResponseEntity<List<GitCommitDto>> getLog(@RequestParam String path, @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(gitService.getLog(path, limit));
    }

    @GetMapping("/branches")
    public ResponseEntity<List<GitBranchDto>> getBranches(@RequestParam String path) {
        return ResponseEntity.ok(gitService.getBranches(path));
    }

    @GetMapping("/diff")
    public ResponseEntity<Map<String, String>> getDiff(@RequestParam String path) {
        return ResponseEntity.ok(Map.of("diff", gitService.getDiff(path)));
    }

    @PostMapping("/commit")
    public ResponseEntity<Map<String, String>> commit(@Valid @RequestBody CommitRequest request) {
        try {
            gitService.commit(request.getRepoPath(), request.getMessage());
            return ResponseEntity.ok(Map.of("message", "Commit successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/push")
    public ResponseEntity<Map<String, String>> push(@RequestBody Map<String, String> body) {
        try {
            String output = gitService.push(body.get("path"));
            return ResponseEntity.ok(Map.of("message", output));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/pull")
    public ResponseEntity<Map<String, String>> pull(@RequestBody Map<String, String> body) {
        try {
            String output = gitService.pull(body.get("path"));
            return ResponseEntity.ok(Map.of("message", output));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> checkout(@RequestBody Map<String, String> body) {
        try {
            gitService.checkout(body.get("path"), body.get("branch"));
            return ResponseEntity.ok(Map.of("message", "Checkout successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
