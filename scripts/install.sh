#!/bin/bash

set -e

# Configuration
BRIDGE_DIR="$HOME/.mac-bridge"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="com.bridge.macbridge.plist"

echo "=== Installing Mac Bridge Agent ==="

# Create bridge dir
mkdir -p "$BRIDGE_DIR"

# Build Jar
echo "Building Spring Boot Backend..."
cd "$(dirname "$0")/../mac-bridge"
mvn clean package -DskipTests

# Copy jar
echo "Deploying Jar..."
cp target/macbridge-0.0.1-SNAPSHOT.jar "$BRIDGE_DIR/mac-bridge.jar"

# Copy runner script
echo "Configuring Runner Script..."
cp ../scripts/mac-bridge.sh "$BRIDGE_DIR/mac-bridge.sh"
chmod +x "$BRIDGE_DIR/mac-bridge.sh"

# Set up launchd agent
echo "Configuring launchd Agent..."
mkdir -p "$LAUNCH_AGENTS_DIR"

# Read plist, replace USER_HOME with real home directory path, and write to LaunchAgents
sed "s|USER_HOME|$HOME|g" ../scripts/$PLIST_FILE > "$LAUNCH_AGENTS_DIR/$PLIST_FILE"

# Unload previous instance if running
echo "Stopping any existing bridge instances..."
launchctl bootout gui/$(id -u) "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true

# Load launchd agent
echo "Starting Mac Bridge Service..."
launchctl bootstrap gui/$(id -u) "$LAUNCH_AGENTS_DIR/$PLIST_FILE"

echo "=== Installation Complete! ==="
echo "Mac Bridge is now running in the background."
echo "Logs are available at: $BRIDGE_DIR/bridge.log"
echo "Launchd logs: $BRIDGE_DIR/launchd_stderr.log"
