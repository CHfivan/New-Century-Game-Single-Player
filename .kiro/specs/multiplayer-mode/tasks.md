# Implementation Plan: Multiplayer Mode

## Overview

Add online multiplayer to Century: Spice Road using a server-authoritative architecture. The server (Node.js + Express + Socket.IO) reuses the existing GameEngine for all game logic. Clients communicate via WebSocket. Single-player mode remains untouched.

## Tasks

- [x] 1. Set up server project and shared code configuration
  - [x] 1.1 Initialize the `/server/` directory with `package.json`, TypeScript config, and dependencies (express, socket.io, cors, dotenv, ts-node-dev)
    - Create `server/package.json` with scripts for `dev`, `build`, and `start`
    - Create `server/tsconfig.json` with TypeScript project references or path aliases pointing to `../src/engine/`, `../src/types/`, and `../src/data/`
    - Ensure the server can import `GameEngine`, types, and data loaders from the shared `src/` code without duplication
    - _Requirements: 11.1, 11.2_

  - [x] 1.2 Create server entry point with Express + Socket.IO bootstrap
    - Create `server/src/index.ts` that initializes Express, attaches Socket.IO, configures CORS from environment variables, and starts listening
    - Implement the health-check GET endpoint at `/health` returning `{ status: "ok" }`
    - Load configuration from environment variables (PORT, ALLOWED_ORIGINS, RECONNECTION_WINDOW_MS, MAX_ROOMS, etc.) with sensible defaults matching the design's `ServerConfig`
    - _Requirements: 11.1, 11.4, 11.5_

  - [x] 1.3 Add `socket.io-client` dependency to the frontend `package.json`
    - Install `socket.io-client` in the root project so the React client can connect to the server
    - _Requirements: 6.1, 6.4_

- [x] 2. Implement server-side Room management
  - [x] 2.1 Implement the `RoomManager` class
    - Create `server/src/RoomManager.ts` implementing `createRoom`, `joinRoom`, `leaveRoom`, `reconnect`, `getRoom`, and `cleanupStaleRooms`
    - Generate 6-character uppercase alphanumeric room codes, ensuring uniqueness among active rooms
    - Enforce max concurrent rooms limit (default 50) and max 5 players per room
    - Generate random session tokens on join for reconnection support
    - Store rooms in an in-memory `Map<string, Room>`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.2, 2.3, 2.4, 2.5, 11.3_

  - [ ]* 2.2 Write unit tests for `RoomManager`
    - Test room creation returns valid 6-char codes
    - Test join/leave updates player list correctly
    - Test max room and max player limits
    - Test reconnection with valid/invalid session tokens
    - Test stale room cleanup
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement server-side Game controller
  - [x] 3.1 Implement the `GameController` class
    - Create `server/src/GameController.ts` implementing `startGame`, `processAction`, `handleDisconnect`, and `handleReconnect`
    - `startGame`: call `GameEngine.createGame()` with player count, assign player names/icons from RoomPlayers, store GameState on Room
    - `processAction`: validate session token maps to current player, call `GameEngine.validateAction()` then `GameEngine.executeAction()`, detect game over via `GameEngine.isGameOver()` and `GameEngine.calculateFinalScores()`
    - `handleDisconnect`: mark player as disconnected, track reconnection deadline
    - `handleReconnect`: restore player session, return current GameState
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.3, 7.4, 7.5, 8.1, 8.3_

  - [ ]* 3.2 Write unit tests for `GameController`
    - Test startGame initializes state with correct player count and names
    - Test processAction rejects invalid actions and wrong-turn actions
    - Test processAction advances turn correctly
    - Test game over detection and final score calculation
    - Test disconnect/reconnect within and outside reconnection window
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 7.1, 7.3, 7.4, 8.1_

- [x] 4. Implement server-side Socket.IO event handler
  - [x] 4.1 Implement the `SocketHandler` class
    - Create `server/src/SocketHandler.ts` that registers Socket.IO event listeners on each connection
    - Wire `room:create` → `RoomManager.createRoom`, emit `room:created` to sender
    - Wire `room:join` → `RoomManager.joinRoom`, emit `room:joined` to sender, broadcast `room:player-joined` to room
    - Wire `room:leave` → `RoomManager.leaveRoom`, broadcast `room:player-left` to room
    - Wire `game:start` → `GameController.startGame`, broadcast `game:state-update` to room
    - Wire `game:action` → `GameController.processAction`, broadcast `game:state-update` to room or emit `game:error` to sender
    - Wire `disconnect` → `GameController.handleDisconnect`, broadcast `room:player-disconnected` to room
    - Wire `room:reconnect` → `GameController.handleReconnect`, broadcast `room:player-reconnected` to room
    - Join/leave Socket.IO rooms using `socket.join(roomCode)` / `socket.leave(roomCode)`
    - _Requirements: 4.1, 4.4, 6.1, 6.2, 6.3, 7.2, 7.5_

  - [x] 4.2 Set up stale room cleanup interval
    - In the server entry point, start a `setInterval` calling `RoomManager.cleanupStaleRooms()` every 60 seconds
    - Clean up rooms with no connected players for more than 10 minutes
    - _Requirements: 11.6_

- [x] 5. Checkpoint - Server-side complete
  - Ensure all server code compiles, tests pass. Ask the user if questions arise.


- [x] 6. Implement shared multiplayer types and client Socket.IO service
  - [x] 6.1 Create shared multiplayer type definitions
    - Create `src/types/multiplayer.ts` defining `Room`, `RoomPlayer`, `LobbyPlayer`, `DisconnectedPlayer`, all Socket.IO event payload interfaces (`CreateRoomPayload`, `JoinRoomPayload`, `ReconnectPayload`, `GameActionPayload`, `RoomCreatedPayload`, `RoomJoinedPayload`, `PlayerJoinedPayload`, `PlayerLeftPayload`, `StateUpdatePayload`, `GameErrorPayload`, `PlayerDisconnectedPayload`, `PlayerReconnectedPayload`, `GameOverPayload`, `ScoreBreakdown`), and `ServerConfig`
    - Export all types from `src/types/multiplayer.ts`
    - These types are used by both client components and can be imported by the server via path aliases
    - _Requirements: 4.1, 6.2, 12.6_

  - [x] 6.2 Create the Socket.IO client connection utility
    - Create `src/multiplayer/socketClient.ts` that exports a function to create/get a singleton Socket.IO client instance
    - Configure the client to connect to the server URL (from environment variable `VITE_SERVER_URL` or default `http://localhost:3001`)
    - Handle connection, disconnection, and reconnection events
    - _Requirements: 6.1, 6.3, 6.4, 10.2_

- [x] 7. Implement MultiplayerContext (client-side state management)
  - [x] 7.1 Create the `MultiplayerContext` React context and provider
    - Create `src/multiplayer/MultiplayerContext.tsx` implementing the `MultiplayerContextValue` interface from the design
    - Manage socket connection lifecycle (connect on mount, disconnect on unmount)
    - Implement `createRoom`, `joinRoom`, `leaveRoom`, `startGame`, `sendAction` methods that emit Socket.IO events
    - Listen for server events (`room:created`, `room:joined`, `room:player-joined`, `room:player-left`, `game:state-update`, `game:error`, `room:player-disconnected`, `room:player-reconnected`, `game:over`) and update context state
    - Track `roomCode`, `players`, `isHost`, `sessionToken`, `gameState`, `myPlayerIndex`, `isMyTurn`, `error`, `disconnectedPlayers`
    - Store `sessionToken` and `roomCode` in `sessionStorage` for reconnection on page refresh
    - _Requirements: 4.2, 4.3, 4.5, 5.3, 7.2, 7.3, 7.5_

  - [ ]* 7.2 Write unit tests for `MultiplayerContext`
    - Test that createRoom emits correct event and updates state on response
    - Test that joinRoom emits correct event and updates state on response
    - Test that sendAction emits game:action event
    - Test that game:state-update updates gameState and computes isMyTurn
    - Test error handling from game:error events
    - _Requirements: 4.2, 5.3, 7.2_

- [x] 8. Implement client-side multiplayer UI components
  - [x] 8.1 Create the `ProfileSetup` component
    - Create `src/components/multiplayer/ProfileSetup.tsx` and `ProfileSetup.css`
    - Display name input field (1-20 chars, alphanumeric + spaces + common punctuation)
    - Display grid of at least 8 predefined character icons for selection (use existing profile images from `public/assets/Profile/` plus additional icons)
    - Validate input and assign defaults ("Player N" name, first icon) if not provided
    - Call `onSubmit(name, icon)` callback when the player confirms
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 8.2 Create the `MultiplayerMenu` component
    - Create `src/components/multiplayer/MultiplayerMenu.tsx` and `MultiplayerMenu.css`
    - Display "Create Room" and "Join Room" buttons
    - "Create Room" flow: show ProfileSetup → call `createRoom(name, icon)` from MultiplayerContext
    - "Join Room" flow: show room code input + ProfileSetup → call `joinRoom(code, name, icon)` from MultiplayerContext
    - Handle and display errors (room not found, room full, game in progress)
    - Include a "Back" button to return to the main menu
    - _Requirements: 1.1, 2.1, 9.3_

  - [x] 8.3 Create the `Lobby` component
    - Create `src/components/multiplayer/Lobby.tsx` and `Lobby.css`
    - Display list of connected players with names, icons, and connection status
    - Display Room_Code prominently and a copyable Invite_Link
    - Show "Start Game" button for the Host, disabled when fewer than 2 players
    - Show "Leave" button for all players
    - Handle player join/leave events updating the player list in real-time
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.7_

  - [x] 8.4 Create the `MultiplayerGameBoard` wrapper component
    - Create `src/components/multiplayer/MultiplayerGameBoard.tsx`
    - Read `gameState`, `myPlayerIndex`, and `isMyTurn` from `MultiplayerContext`
    - Render the existing `GameBoardContainer` and related components, passing the server-provided GameState
    - Override action handlers to call `sendAction()` from MultiplayerContext instead of local dispatch
    - Disable action controls when `isMyTurn` is false
    - Display turn indicator showing which player's turn it is
    - Display disconnection notices when players disconnect (with reconnection countdown)
    - _Requirements: 4.2, 4.3, 4.5, 7.2, 7.5, 12.7_

  - [ ]* 8.5 Write unit tests for multiplayer UI components
    - Test ProfileSetup validates name length and assigns defaults
    - Test MultiplayerMenu renders Create/Join buttons and handles flows
    - Test Lobby displays players and disables Start when < 2 players
    - Test MultiplayerGameBoard disables actions when not player's turn
    - _Requirements: 12.1, 12.2, 12.4, 3.1, 3.2, 4.3_

- [x] 9. Checkpoint - Client components complete
  - Ensure all client code compiles, tests pass. Ask the user if questions arise.

- [x] 10. Integrate multiplayer into the main application flow
  - [x] 10.1 Add "Multiplayer" button to the existing `MainMenu` component
    - Add a "🌐 Multiplayer" button alongside the existing "New Game" and "Load Game" buttons
    - When clicked, navigate to the multiplayer flow (MultiplayerMenu)
    - Do NOT modify any existing single-player functionality
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.2 Implement multiplayer screen navigation in `Demo.tsx`
    - Add a `multiplayerPhase` state to track the multiplayer flow: `'menu' | 'lobby' | 'playing' | null`
    - When `multiplayerPhase` is non-null, wrap content in `MultiplayerProvider` and render the appropriate multiplayer component
    - When `multiplayerPhase` is null, render the existing single-player flow unchanged
    - Handle transitions: MainMenu → MultiplayerMenu → ProfileSetup → Lobby → MultiplayerGameBoard
    - Handle "Back" navigation at each step returning to the previous screen
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.3 Handle Invite_Link URL routing
    - On app load, check if the URL contains a room code parameter (e.g., `?room=ABCD12`)
    - If a room code is present, automatically navigate to the join flow with the code pre-filled
    - Generate invite links in the format `{window.location.origin}?room={roomCode}`
    - _Requirements: 1.4, 2.1, 2.6, 3.5_

  - [x] 10.4 Implement game completion flow for multiplayer
    - When `game:over` event is received, display final scores with breakdown (point cards, coins, remaining spices)
    - Show winner announcement
    - Offer Host a "Return to Lobby" button to start a new game with the same players
    - Offer all players a "Back to Menu" button
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Checkpoint - Integration complete
  - Ensure the full multiplayer flow works end-to-end: create room → join → lobby → start game → play turns → game over. Ensure single-player mode still works. Ask the user if questions arise.

- [x] 12. Server deployment configuration
  - [x] 12.1 Create deployment configuration files
    - Create `server/Dockerfile` for containerized deployment
    - Create `server/.env.example` documenting all environment variables with defaults
    - Update `server/package.json` with a `start` script suitable for production (`node dist/index.js`)
    - Add build script that compiles TypeScript to JavaScript
    - _Requirements: 10.1, 10.4, 11.1, 11.5_

  - [x] 12.2 Configure the Vite client build for multiplayer
    - Add `VITE_SERVER_URL` environment variable support in the client
    - Ensure `socket.io-client` is properly bundled in the production build
    - Update Vite config if needed for WebSocket proxy during development
    - _Requirements: 10.2, 10.3_

- [x] 13. Final checkpoint - All tests pass and deployment ready
  - Ensure all server and client tests pass, the build succeeds for both server and client, and deployment config is complete. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The server reuses `GameEngine` from `src/engine/` — no game logic duplication
- Single-player mode is never modified; multiplayer is additive only
- Unit tests validate specific examples and edge cases
