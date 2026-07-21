# Developer Manual

## Codebase Architecture

The project is split into standard modern web project parts:

- **Spring Boot (Java 21)**: Uses Maven for dependency management. Standard packages:
  - `com.bridge.macbridge.config`: Spring configurations (Security, CORS, WebSocket, Task Schedulers).
  - `com.bridge.macbridge.controller`: REST controller entry points.
  - `com.bridge.macbridge.service`: Business logic core (terminal processes, file security, git execution).
  - `com.bridge.macbridge.security`: JWT utilities and rate limiting request filters.
  - `com.bridge.macbridge.dto`: API JSON bindings.
  
- **Vite React Frontend**:
  - `src/api`: Axios clients, baseURL mapping, and token refreshing interceptors.
  - `src/store`: Zustand state management (Auth, Settings, Connection status).
  - `src/pages`: Mobile-responsive dashboard views.
  - `src/hooks`: Websocket (STOMP) subscription lifecycle listeners.

## Testing Setup

We use curl-based E2E scripts to verify REST route security and path traversal policies.

To run tests:
1. Start the backend: `mvn spring-boot:run`
2. Run E2E test suite:
   ```bash
   ./test-e2e.sh
   ```

## Development Guidelines

### 1. Adding REST APIs
- Always define a dedicated request/response DTO.
- Bind validator filters with `@Valid` on request bodies.
- Enforce path normalization and sandboxing when accepting path inputs.
- Register endpoints in `SecurityConfig.java` to specify public or authenticated routes.

### 2. Adding WebSocket Streams
- Define a unique sub-destination string (e.g. `/topic/features/{id}`).
- Inject `SimpMessagingTemplate` in your service and push updates.
- Listen and unsubscribe cleanly in React components using custom STOMP hooks.
