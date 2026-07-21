#!/bin/bash

# Configuration
BRIDGE_DIR="$HOME/.mac-bridge"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="com.bridge.macbridge.plist"

echo "=== Uninstalling Mac Bridge Agent ==="

# Stop launchd agent
echo "Stopping Mac Bridge background service..."
launchctl bootout gui/$(id -u) "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true

# Remove launchd plist
if [ -f "$LAUNCH_AGENTS_DIR/$PLIST_FILE" ]; then
    echo "Removing launchd configuration..."
    rm "$LAUNCH_AGENTS_DIR/$PLIST_FILE"
fi

# Remove application directory
if [ -d "$BRIDGE_DIR" ]; then
    read -p "Do you want to delete all persistent files (keys, databases, chats) in $BRIDGE_DIR? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting $BRIDGE_DIR..."
        rm -rf "$BRIDGE_DIR"
    else
        echo "Keeping $BRIDGE_DIR (contains persistent keys and settings)."
        # Clean up runner and jar to avoid issues, leaving configs intact
        rm -f "$BRIDGE_DIR/mac-bridge.jar"
        rm -f "$BRIDGE_DIR/mac-bridge.sh"
    fi
fi

echo "=== Uninstallation Complete! ==="
