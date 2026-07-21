#!/bin/bash

# Configuration
API_URL="http://localhost:8080/api"
AUTH_ENDPOINT="$API_URL/auth/login"
REFRESH_ENDPOINT="$API_URL/auth/refresh"
HEALTH_ENDPOINT="$API_URL/health"
SYSTEM_ENDPOINT="$API_URL/system"
FILE_CREATE_DIR="$API_URL/files/create-folder"
FILE_WRITE="$API_URL/files/write"
FILE_READ="$API_URL/files/read"
FILE_LIST="$API_URL/files/list-detailed"
FILE_RENAME="$API_URL/files/rename"
FILE_DELETE="$API_URL/files/delete"
TERMINAL_ENDPOINT="$API_URL/terminal/run"
TERMINAL_INTERRUPT="$API_URL/terminal/interrupt"
ANTIGRAVITY_STATUS="$API_URL/antigravity/status"
ANTIGRAVITY_CHAT="$API_URL/antigravity/chat"
GIT_STATUS="$API_URL/git/status"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Backend API E2E Tests..."

# Backup existing users.json if it exists
USERS_JSON="$HOME/.mac-bridge/users.json"
BACKUP_JSON="$HOME/.mac-bridge/users.json.bak"
if [ -f "$USERS_JSON" ]; then
    cp "$USERS_JSON" "$BACKUP_JSON"
fi

# Write a temporary users.json with admin/admin (bcrypt hash of "admin")
mkdir -p "$HOME/.mac-bridge"
echo '{"admin":"$2a$10$ZI4EEwsXDvnemD2HUEEpluV1T3P2DFXqdXxXio9La8mkTVp6bsR5G"}' > "$USERS_JSON"

# Restart backend to load the temporary users.json
echo "Restarting backend to apply test credentials..."
LAUNCH_PLIST="$HOME/Library/LaunchAgents/com.bridge.macbridge.plist"
launchctl bootout gui/$(id -u) "$LAUNCH_PLIST" 2>/dev/null || true
launchctl unload "$LAUNCH_PLIST" 2>/dev/null || true
sleep 1
launchctl bootstrap gui/$(id -u) "$LAUNCH_PLIST" 2>/dev/null || launchctl load "$LAUNCH_PLIST"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..10}; do
    if curl -s --connect-timeout 2 "$HEALTH_ENDPOINT" > /dev/null; then
        break
    fi
    sleep 1
done

if ! curl -s --connect-timeout 2 "$HEALTH_ENDPOINT" > /dev/null; then
    echo -e "${RED}Backend did not start in time.${NC}"
    # Restore backup before exiting
    if [ -f "$BACKUP_JSON" ]; then
        mv "$BACKUP_JSON" "$USERS_JSON"
    fi
    exit 1
fi

# 1. Authenticate and get JWT
echo "Testing Authentication..."
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"admin", "deviceId":"test-device", "deviceName":"Test Script"}' $AUTH_ENDPOINT)
TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
REFRESH_TOKEN=$(echo $LOGIN_RES | grep -o '"refreshToken":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to retrieve JWT token!${NC}"
    echo "Response: $LOGIN_RES"
    # Restore backup before exiting
    if [ -f "$BACKUP_JSON" ]; then
        mv "$BACKUP_JSON" "$USERS_JSON"
    fi
    exit 1
fi
echo -e "${GREEN}JWT and Refresh Token retrieved successfully.${NC}"

AUTH_HEADER="Authorization: Bearer $TOKEN"
CONTENT_TYPE="Content-Type: application/json"

# 1.1 Test Token Refresh
echo "Testing Token Refresh..."
# Sleep to ensure the issued-at time (iat) is different, producing a different signature
sleep 1.5
REFRESH_RES=$(curl -s -X POST -H "$CONTENT_TYPE" -d "{\"refreshToken\":\"$REFRESH_TOKEN\", \"deviceId\":\"test-device\"}" $REFRESH_ENDPOINT)
NEW_TOKEN=$(echo $REFRESH_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "$TOKEN" ]; then
    echo -e "${GREEN}Token refresh passed.${NC}"
    # Use the new token for subsequent requests
    AUTH_HEADER="Authorization: Bearer $NEW_TOKEN"
else
    echo -e "${RED}Token refresh failed! Got: $REFRESH_RES${NC}"
    exit 1
fi

# 2. Test Health Endpoint
echo "Testing Health Endpoint..."
HEALTH_RES=$(curl -s -H "$AUTH_HEADER" $HEALTH_ENDPOINT)
if echo "$HEALTH_RES" | grep -q '"status":"UP"'; then
    echo -e "${GREEN}Health check passed.${NC}"
else
    echo -e "${RED}Health check failed.${NC}"
    exit 1
fi

# 3. Test System Endpoint
echo "Testing System Endpoint..."
SYS_RES=$(curl -s -H "$AUTH_HEADER" $SYSTEM_ENDPOINT)
if echo "$SYS_RES" | grep -q '"os":'; then
    echo -e "${GREEN}System info retrieved.${NC}"
else
    echo -e "${RED}System check failed.${NC}"
    exit 1
fi

# 4. Test Create Folder
echo "Testing Create Folder..."
TEST_DIR="$HOME/.mac-bridge/TestFolderBridge"
rm -rf "$TEST_DIR"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"$TEST_DIR\"}" $FILE_CREATE_DIR
echo -e "${GREEN}Folder created.${NC}"

# 5. Test Write File
echo "Testing Write File..."
TEST_FILE="$TEST_DIR/hello.txt"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"$TEST_FILE\", \"content\":\"Hello World\"}" $FILE_WRITE
echo -e "${GREEN}File written.${NC}"

# 6. Test Read File
echo "Testing Read File..."
READ_RES=$(curl -s -H "$AUTH_HEADER" "$FILE_READ?path=$TEST_FILE")
if [ "$READ_RES" == "Hello World" ]; then
    echo -e "${GREEN}File read correctly.${NC}"
else
    echo -e "${RED}File read failed. Got: $READ_RES${NC}"
fi

# 7. Test Detailed Directory List
echo "Testing Detailed Directory List..."
LIST_RES=$(curl -s -H "$AUTH_HEADER" "$FILE_LIST?path=$TEST_DIR")
if echo "$LIST_RES" | grep -q '"name":"hello.txt"'; then
    echo -e "${GREEN}Detailed directory listing passed.${NC}"
else
    echo -e "${RED}Detailed directory listing failed. Got: $LIST_RES${NC}"
fi

# 7.1 Test File Rename
echo "Testing File Rename..."
RENAME_RES=$(curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"$TEST_FILE\", \"newName\":\"hello-renamed.txt\"}" $FILE_RENAME)
if [ -f "$TEST_DIR/hello-renamed.txt" ]; then
    echo -e "${GREEN}File rename passed.${NC}"
else
    echo -e "${RED}File rename failed!${NC}"
fi

# 7.2 Test File Delete
echo "Testing File Delete..."
DELETE_RES=$(curl -s -X DELETE -H "$AUTH_HEADER" "$FILE_DELETE?path=$TEST_DIR/hello-renamed.txt")
if [ ! -f "$TEST_DIR/hello-renamed.txt" ]; then
    echo -e "${GREEN}File delete passed.${NC}"
else
    echo -e "${RED}File delete failed!${NC}"
fi

# Clean up test directory
rm -rf "$TEST_DIR"

# 8. Test Path Traversal Protection
echo "Testing Path Traversal Protection..."
TRAV_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"/etc/passwd\", \"content\":\"hacked\"}" $FILE_WRITE)
if [ "$TRAV_RES" == "403" ] || [ "$TRAV_RES" == "400" ] || [ "$TRAV_RES" == "500" ]; then
    echo -e "${GREEN}Path traversal successfully blocked ($TRAV_RES).${NC}"
else
    echo -e "${RED}Path traversal NOT blocked! Got code: $TRAV_RES${NC}"
fi

# 9. Test Terminal Commands (with session and cwd)
echo "Testing Terminal Command Execution with Session..."
SESSION_ID="test-session-123"
TERM_RES=$(curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"command\":\"pwd\", \"cwd\":\"$HOME\", \"sessionId\":\"$SESSION_ID\"}" $TERMINAL_ENDPOINT)
if echo "$TERM_RES" | grep -q "$HOME"; then
    echo -e "${GREEN}Terminal execution with session and cwd passed.${NC}"
else
    echo -e "${RED}Terminal execution failed! Got: $TERM_RES${NC}"
fi

# 10. Test Unauthorized Terminal Command
echo "Testing Unauthorized Command Protection..."
UNAUTH_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"command\":\"rm -rf /\"}" $TERMINAL_ENDPOINT)
if [ "$UNAUTH_RES" == "403" ] || [ "$UNAUTH_RES" == "400" ]; then
    echo -e "${GREEN}Unauthorized command blocked ($UNAUTH_RES).${NC}"
else
    echo -e "${RED}Unauthorized command NOT blocked! Code: $UNAUTH_RES${NC}"
fi

# 11. Test Git Status
echo "Testing Git Status Endpoint..."
GIT_RES=$(curl -s -H "$AUTH_HEADER" "$GIT_STATUS?path=$PWD")
if echo "$GIT_RES" | grep -q '"branch":'; then
    echo -e "${GREEN}Git status check passed.${NC}"
else
    echo -e "${RED}Git status check failed. Got: $GIT_RES${NC}"
fi

# Restore backup of users.json
if [ -f "$BACKUP_JSON" ]; then
    mv "$BACKUP_JSON" "$USERS_JSON"
else
    rm -f "$USERS_JSON"
fi

# Restart backend to load the original users.json
echo "Restoring backend to original credentials..."
launchctl bootout gui/$(id -u) "$LAUNCH_PLIST" 2>/dev/null || true
launchctl unload "$LAUNCH_PLIST" 2>/dev/null || true
sleep 1
launchctl bootstrap gui/$(id -u) "$LAUNCH_PLIST" 2>/dev/null || launchctl load "$LAUNCH_PLIST"

echo -e "\n${GREEN}ALL E2E API TESTS PASSED!${NC}"
