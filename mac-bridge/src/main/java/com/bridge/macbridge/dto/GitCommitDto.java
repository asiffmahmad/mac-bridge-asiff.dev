package com.bridge.macbridge.dto;

public class GitCommitDto {
    private String hash;
    private String author;
    private String date;
    private String message;

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
