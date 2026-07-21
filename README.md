# Mac Bridge — Complete Remote Mac Management Platform

A production-ready remote macOS administration and automation bridge. It features a React-Vite web frontend and a secure Spring Boot backend agent that runs locally on your Mac.

## Key Features

1. **Secure Connectivity & Pairing**:
   - Zero-configuration Cloudflare/Tailscale tunnel discovery.
   - Secure pairing flow (QR and short codes) with dynamic device registries.
   - Dual-token (JWT + device-specific refresh tokens) rotation security.
   - Host-level rate limiting and request throttling.

2. **Interactive Terminal**:
   - Multiple bash shell session tracking.
   - Safe/Full operational execution policies.
   - Command cancellation (Ctrl+C style signals).
   - Command execution history tracking.

3. **File Management**:
   - Fully featured directory tree explorer with file size, metadata, and POSIX permissions.
   - File actions: read, write, create folder, copy, move, rename, delete.
   - Local storage security constraints preventing traversal attacks.

4. **Git Workspace Integration**:
   - Commit history log viewer.
   - Live branch switcher.
   - Interactive commit, push, pull, and stash handlers.
   - Structured JSON git statuses.

5. **Axiomatic System & Antigravity integration**:
   - Full hardware specifications & dynamic CPU/Memory resource reporting.
   - Interactive processes monitor and listening TCP ports tracker.
   - Real-time power metrics (battery percentage & power source status).
   - Real-time streaming interface for Google Antigravity SDK operations.

## Directory Structure

```
├── mac-bridge            # Spring Boot (Java 21) Backend Agent
├── mac-bridge-web        # React + Vite + TailwindCSS / Zustand Frontend
├── scripts               # Daemon launchers and installation wrappers
└── docs                  # Technical manuals and design specification docs
```

## Quick Start

### 1. Prerequisites
- macOS (tested on macOS Ventura/Sonoma)
- Java 21+
- Maven 3.8+
- Node.js 18+ & npm

### 2. Build & Install Agent
You can build and deploy the Mac Bridge backend agent as a launchd background service using our installer:

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

This compiles the backend, deploys it to `~/.mac-bridge/mac-bridge.jar`, installs a launcher to `~/Library/LaunchAgents/com.bridge.macbridge.plist`, and starts the background daemon.

### 3. Build & Run Frontend
```bash
cd mac-bridge-web
npm install
npm run dev
```

Open the browser at the shown localhost address (e.g. `http://localhost:5173`). Configure your target bridge URL and login with the credentials found in `~/.mac-bridge/users.json`.

## Documentation
Please refer to the files in the `docs/` folder for comprehensive documentation:
- [Architecture & Design](docs/architecture.md)
- [API Reference](docs/api.md)
- [Installation Guide](docs/installation.md)
- [Developer Manual](docs/developer.md)
- [Troubleshooting](docs/troubleshooting.md)
