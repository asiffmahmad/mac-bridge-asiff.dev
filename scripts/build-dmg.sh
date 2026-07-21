#!/usr/bin/env bash
# =============================================================================
# build-dmg.sh — Build Mac Bridge installer DMG
# Usage: bash scripts/build-dmg.sh
#
# Produces: dist/MacBridge-<version>.dmg
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION="1.0.0"
APP_NAME="MacBridge"
BUILD_DIR="$PROJECT_DIR/dist"
APP_DIR="$BUILD_DIR/$APP_NAME.app"
DMG_NAME="$APP_NAME-$VERSION.dmg"
DMG_PATH="$BUILD_DIR/$DMG_NAME"

echo "=============================================="
echo "  Mac Bridge DMG Builder v$VERSION"
echo "=============================================="

# ---- 1. Build the Spring Boot JAR ----
echo ""
echo "[1/5] Building Spring Boot backend..."
cd "$PROJECT_DIR/mac-bridge"
mvn -q package -DskipTests
JAR_PATH=$(find target -name "*.jar" -not -name "*sources*" | head -1)
echo "      → Built: $JAR_PATH"

# ---- 2. Compile the Swift Menu Bar App ----
echo ""
echo "[2/5] Compiling Swift Menu Bar App..."
MENU_BAR_BINARY="$BUILD_DIR/MacBridgeMenuBar"
swiftc "$SCRIPT_DIR/MenuBarApp.swift" -o "$MENU_BAR_BINARY"
echo "      → Binary: $MENU_BAR_BINARY"

# ---- 3. Build the .app bundle ----
echo ""
echo "[3/5] Assembling .app bundle..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"
mkdir -p "$APP_DIR/Contents/Resources/bridge"

# Copy backend JAR
cp "$PROJECT_DIR/mac-bridge/$JAR_PATH" "$APP_DIR/Contents/Resources/bridge/mac-bridge.jar"

# Copy scripts
cp "$SCRIPT_DIR/install.sh"   "$APP_DIR/Contents/Resources/"
cp "$SCRIPT_DIR/uninstall.sh" "$APP_DIR/Contents/Resources/"
cp "$SCRIPT_DIR/mac-bridge.sh" "$APP_DIR/Contents/Resources/"
chmod +x "$APP_DIR/Contents/Resources/"*.sh

# Put the menu bar binary as the app's main executable
cp "$MENU_BAR_BINARY" "$APP_DIR/Contents/MacOS/$APP_NAME"
chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>dev.asiff.macbridge</string>
  <key>CFBundleName</key>
  <string>MacBridge</string>
  <key>CFBundleDisplayName</key>
  <string>Mac Bridge</string>
  <key>CFBundleVersion</key>
  <string>$VERSION</string>
  <key>CFBundleShortVersionString</key>
  <string>$VERSION</string>
  <key>CFBundleExecutable</key>
  <string>$APP_NAME</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
</dict>
</plist>
EOF

echo "      → App bundle ready: $APP_DIR"

# ---- 4. Create LaunchAgent plist for start-at-login ----
echo ""
echo "[4/5] Creating LaunchAgent plist..."
PLIST_PATH="$APP_DIR/Contents/Resources/dev.asiff.macbridge.plist"
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.asiff.macbridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>$APP_DIR/Contents/MacOS/$APP_NAME</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/mac-bridge-menu.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/mac-bridge-menu-error.log</string>
</dict>
</plist>
EOF

# ---- 5. Package into DMG ----
echo ""
echo "[5/5] Creating DMG..."
mkdir -p "$BUILD_DIR"
hdiutil create \
  -volname "$APP_NAME $VERSION" \
  -srcfolder "$APP_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH" \
  -quiet

echo ""
echo "=============================================="
echo "  ✅ Success!"
echo ""
echo "  DMG:  $DMG_PATH"
echo ""
echo "  INSTALLATION:"
echo "  1. Open the DMG"
echo "  2. Drag MacBridge.app to Applications"
echo "  3. Run: bash /Applications/MacBridge.app/Contents/Resources/install.sh"
echo "  4. MacBridge starts automatically at login"
echo "=============================================="
