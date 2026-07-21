package com.bridge.macbridge.service;

import com.bridge.macbridge.dto.GitBranchDto;
import com.bridge.macbridge.dto.GitCommitDto;
import com.bridge.macbridge.dto.GitStatusDto;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class GitService {

    private String executeGitCommand(String repoPath, String... args) {
        try {
            File dir = new File(repoPath);
            if (!dir.exists() || !dir.isDirectory()) {
                throw new IllegalArgumentException("Invalid repository path");
            }
            
            List<String> command = new ArrayList<>();
            command.add("git");
            command.addAll(List.of(args));
            
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(dir);
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("Git command failed: " + output.toString());
            }
            return output.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error executing git command: " + e.getMessage());
        }
    }

    public GitStatusDto getStatus(String repoPath) {
        GitStatusDto dto = new GitStatusDto();
        dto.setStaged(new ArrayList<>());
        dto.setModified(new ArrayList<>());
        dto.setUntracked(new ArrayList<>());
        
        try {
            // Get branch
            String branch = executeGitCommand(repoPath, "rev-parse", "--abbrev-ref", "HEAD").trim();
            dto.setBranch(branch);
            
            // Get porcelain status
            String status = executeGitCommand(repoPath, "status", "--porcelain");
            String[] lines = status.split("\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                
                String xy = line.substring(0, 2);
                String file = line.substring(3).trim();
                
                if (xy.charAt(0) != ' ' && xy.charAt(0) != '?') {
                    dto.getStaged().add(file);
                }
                if (xy.charAt(1) == 'M' || xy.charAt(1) == 'D') {
                    dto.getModified().add(file);
                }
                if (xy.equals("??")) {
                    dto.getUntracked().add(file);
                }
            }
        } catch (Exception e) {
            // Ignored, likely not a git repo
        }
        return dto;
    }

    public List<GitCommitDto> getLog(String repoPath, int limit) {
        List<GitCommitDto> commits = new ArrayList<>();
        try {
            // Format: hash|author|date|message
            String log = executeGitCommand(repoPath, "log", "-" + limit, "--pretty=format:%H|%an|%ar|%s");
            String[] lines = log.split("\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\\|", 4);
                if (parts.length == 4) {
                    GitCommitDto commit = new GitCommitDto();
                    commit.setHash(parts[0]);
                    commit.setAuthor(parts[1]);
                    commit.setDate(parts[2]);
                    commit.setMessage(parts[3]);
                    commits.add(commit);
                }
            }
        } catch (Exception e) {}
        return commits;
    }

    public List<GitBranchDto> getBranches(String repoPath) {
        List<GitBranchDto> branches = new ArrayList<>();
        try {
            String out = executeGitCommand(repoPath, "branch");
            String[] lines = out.split("\n");
            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                GitBranchDto branch = new GitBranchDto();
                if (line.startsWith("* ")) {
                    branch.setCurrent(true);
                    branch.setName(line.substring(2).trim());
                } else {
                    branch.setCurrent(false);
                    branch.setName(line.trim());
                }
                branches.add(branch);
            }
        } catch (Exception e) {}
        return branches;
    }

    public String getDiff(String repoPath) {
        try {
            return executeGitCommand(repoPath, "diff");
        } catch (Exception e) {
            return "";
        }
    }

    public void commit(String repoPath, String message) {
        executeGitCommand(repoPath, "add", ".");
        executeGitCommand(repoPath, "commit", "-m", message);
    }

    public String push(String repoPath) {
        return executeGitCommand(repoPath, "push");
    }

    public String pull(String repoPath) {
        return executeGitCommand(repoPath, "pull");
    }

    public void checkout(String repoPath, String branch) {
        executeGitCommand(repoPath, "checkout", branch);
    }

    public String stash(String repoPath, String action) {
        return executeGitCommand(repoPath, "stash", action);
    }
}
