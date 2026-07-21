#!/bin/bash

# Configuration
BRIDGE_DIR="$HOME/.mac-bridge"
JAR_PATH="$BRIDGE_DIR/mac-bridge.jar"
LOG_PATH="$BRIDGE_DIR/bridge.log"

mkdir -p "$BRIDGE_DIR"

echo "Starting Mac Bridge..." >> "$LOG_PATH"
date >> "$LOG_PATH"

# Ensure java is available
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed or not in PATH." >> "$LOG_PATH"
    exit 1
fi

# Run the jar
java -jar "$JAR_PATH" >> "$LOG_PATH" 2>&1
