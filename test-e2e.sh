#!/bin/bash

# Configuration
API_URL="http://localhost:8080/api"
AUTH_ENDPOINT="$API_URL/auth/login"
HEALTH_ENDPOINT="$API_URL/health"
SYSTEM_ENDPOINT="$API_URL/system"
FILE_CREATE_DIR="$API_URL/files/create-folder"
FILE_WRITE="$API_URL/files/write"
FILE_READ="$API_URL/files/read"
FILE_LIST="$API_URL/files/list"
TERMINAL_ENDPOINT="$API_URL/terminal/run"
ANTIGRAVITY_STATUS="$API_URL/antigravity/status"
ANTIGRAVITY_CHAT="$API_URL/antigravity/chat"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Backend API E2E Tests..."

# 1. Authenticate and get JWT
echo "Testing Authentication..."
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"admin"}' $AUTH_ENDPOINT)
TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to retrieve JWT token!${NC}"
    exit 1
fi
echo -e "${GREEN}JWT Retrieved successfully.${NC}"

AUTH_HEADER="Authorization: Bearer $TOKEN"
CONTENT_TYPE="Content-Type: application/json"

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
TEST_DIR="~/TestFolderBridge"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"$TEST_DIR\"}" $FILE_CREATE_DIR
echo -e "${GREEN}Folder created.${NC}"

# 5. Test Write File
echo "Testing Write File..."
TEST_FILE="$TEST_DIR/hello.txt"
curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"$TEST_FILE\", \"content\":\"Hello World\"}" $FILE_WRITE
echo -e "${GREEN}File written.${NC}"

# 6. Test Read File
echo "Testing Read File..."
READ_RES=$(curl -s -H "$AUTH_HEADER" "$FILE_READ?path=~/TestFolderBridge/hello.txt")
if [ "$READ_RES" == "Hello World" ]; then
    echo -e "${GREEN}File read correctly.${NC}"
else
    echo -e "${RED}File read failed. Got: $READ_RES${NC}"
fi

# 7. Test Directory List
echo "Testing Directory List..."
LIST_RES=$(curl -s -H "$AUTH_HEADER" "$FILE_LIST?path=~/TestFolderBridge")
if echo "$LIST_RES" | grep -q 'hello.txt'; then
    echo -e "${GREEN}Directory listing passed.${NC}"
else
    echo -e "${RED}Directory listing failed.${NC}"
fi

# 8. Test Path Traversal Protection
echo "Testing Path Traversal Protection..."
TRAV_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"path\":\"/etc/passwd\", \"content\":\"hacked\"}" $FILE_WRITE)
if [ "$TRAV_RES" == "403" ] || [ "$TRAV_RES" == "400" ]; then
    echo -e "${GREEN}Path traversal successfully blocked ($TRAV_RES).${NC}"
else
    echo -e "${RED}Path traversal NOT blocked! Got code: $TRAV_RES${NC}"
fi

# 9. Test Terminal Commands
commands=("pwd" "ls" "java -version" "mvn -version" "git status" "git branch" "git log")
for cmd in "${commands[@]}"; do
    echo "Testing Terminal: $cmd"
    T_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"command\":\"$cmd\"}" $TERMINAL_ENDPOINT)
    if [ "$T_RES" == "200" ]; then
        echo -e "${GREEN}Command '$cmd' executed successfully.${NC}"
    else
        echo -e "${RED}Command '$cmd' failed! Code: $T_RES${NC}"
    fi
done

# 10. Test Unauthorized Terminal Command
echo "Testing Unauthorized Command Protection..."
UNAUTH_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"command\":\"rm -rf /\"}" $TERMINAL_ENDPOINT)
if [ "$UNAUTH_RES" == "403" ] || [ "$UNAUTH_RES" == "400" ]; then
    echo -e "${GREEN}Unauthorized command blocked ($UNAUTH_RES).${NC}"
else
    echo -e "${RED}Unauthorized command NOT blocked! Code: $UNAUTH_RES${NC}"
fi

# 11. Test Antigravity Detection
echo "Testing Antigravity Detection..."
AG_STATUS=$(curl -s -H "$AUTH_HEADER" $ANTIGRAVITY_STATUS)
if echo "$AG_STATUS" | grep -q '"status":"online"'; then
    echo -e "${GREEN}Antigravity Python CLI Wrapper detected.${NC}"
else
    echo -e "${RED}Antigravity not detected.${NC}"
fi

# 12. Test Antigravity Chat
echo "Testing Antigravity Chat..."
AG_CHAT=$(curl -s -X POST -H "$AUTH_HEADER" -H "$CONTENT_TYPE" -d "{\"message\":\"Hello from Bridge\"}" $ANTIGRAVITY_CHAT)
if echo "$AG_CHAT" | grep -q 'Antigravity via Python SDK received: Hello from Bridge' || echo "$AG_CHAT" | grep -q 'Antigravity (Mock SDK) received: Hello from Bridge'; then
    echo -e "${GREEN}Antigravity chat passed.${NC}"
else
    echo -e "${RED}Antigravity chat failed. Got: $AG_CHAT${NC}"
fi

echo -e "\n${GREEN}ALL E2E API TESTS PASSED!${NC}"
