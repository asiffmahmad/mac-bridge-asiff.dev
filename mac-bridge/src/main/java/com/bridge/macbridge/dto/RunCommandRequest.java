package com.bridge.macbridge.dto;

import jakarta.validation.constraints.NotBlank;

public class RunCommandRequest {

    @NotBlank(message = "Command is required")
    private String command;

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }
}
