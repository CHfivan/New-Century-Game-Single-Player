# Requirements Document

## Introduction

This document specifies the requirements for adding online multiplayer functionality to the Century: Spice Road card game. The feature enables human players on separate devices and networks to play together in real-time through a browser, using WebSocket-based communication and a server-authoritative architecture. The existing single-player mode remains fully functional and unmodified.

## Glossary

- **Game_Client**: The React frontend application running in a player's browser that renders the game UI and sends player actions to the Game_Server.
- **Game_Server**: A Node.js backend service that hosts game rooms, runs the GameEngine for move validation and state transitions, and broadcasts state updates to connected Game_Clients via WebSockets.
- **Room**: A server-side session identified by a unique Room_Code that groups connected players for a single multiplayer game.
- **Room_Code**: A short, human-readable alphanumeric string (e.g., "ABCD12") that uniquely identifies a Room.
- **Invite_Link**: A URL containing the Room_Code that allows a player to join a Room by clicking the link in their browser.
- **Host**: The player who creates a Room and has the ability to start the game once enough players have joined.
- **Lobby**: A waiting area within a Room where players gather before the game begins, displaying connected player names and readiness status.
- **WebSocket_Connection**: A persistent, bidirectional communication channel between a Game_Client and the Game_Server using the Socket.IO library.
- **Game_State**: The complete state of a game as defined by the existing GameState type, managed authoritatively by the Game_Server.
- **Reconnection_Window**: A configurable time period during which a disconnected player may rejoin an active game without forfeiting.
- **Free_Hosting_Tier**: A cloud hosting plan (e.g., Render.com, Railway, or Fly.io) that provides compute resources at no cost, suitable for running the Game_Server.

## Requirements

### Requirement 1: Room Creation

**User Story:** As a player, I want to create a multiplayer game room, so that I can invite friends to play with me.

#### Acceptance Criteria

1. WHEN a player selects "Create Room" from the main menu, THE Game_Server SHALL create a new Room and return a unique Room_Code to the Game_Client.
2. THE Game_Server SHALL generate Room_Codes as 6-character uppercase alphanumeric strings.
3. THE Game_Server SHALL reject Room creation when the maximum number of concurrent Rooms is reached and return a descriptive error message to the Game_Client.
4. WHEN a Room is created, THE Game_Client SHALL display the Room_Code and a copyable Invite_Link to the Host.
5. THE Game_Server SHALL ensure each generated Room_Code is unique among all active Rooms.

### Requirement 2: Room Joining

**User Story:** As a player, I want to join a friend's game room, so that I can play multiplayer with them.

#### Acceptance Criteria

1. WHEN a player enters a valid Room_Code or opens an Invite_Link, THE Game_Client SHALL send a join request to the Game_Server.
2. WHEN a valid join request is received, THE Game_Server SHALL add the player to the Room and broadcast the updated player list to all Game_Clients in the Room.
3. IF a player attempts to join a Room that does not exist, THEN THE Game_Server SHALL return an error indicating the Room was not found.
4. IF a player attempts to join a Room that is already full (maximum 5 players), THEN THE Game_Server SHALL return an error indicating the Room is full.
5. IF a player attempts to join a Room where the game has already started, THEN THE Game_Server SHALL return an error indicating the game is in progress.
6. WHEN a player joins via an Invite_Link, THE Game_Client SHALL extract the Room_Code from the URL and automatically attempt to join the Room.

### Requirement 3: Lobby and Game Start

**User Story:** As a host, I want a lobby where I can see who has joined and start the game when ready, so that I can control when the match begins.

#### Acceptance Criteria

1. WHILE players are in the Lobby, THE Game_Client SHALL display the list of connected player names and their connection status.
2. WHILE fewer than 2 players are in the Lobby, THE Game_Client SHALL disable the "Start Game" button for the Host.
3. WHEN the Host selects "Start Game" with 2 to 5 players in the Lobby, THE Game_Server SHALL initialize a new game using the GameEngine and broadcast the initial Game_State to all Game_Clients.
4. WHEN a player disconnects from the Lobby before the game starts, THE Game_Server SHALL remove the player from the Room and broadcast the updated player list.
5. THE Game_Client SHALL display the Invite_Link and Room_Code in the Lobby so the Host can share them with additional players.

### Requirement 4: Real-Time Game State Synchronization

**User Story:** As a player, I want to see the game update in real-time when other players take their turns, so that the game feels responsive and live.

#### Acceptance Criteria

1. WHEN the Game_Server processes a valid game action, THE Game_Server SHALL broadcast the updated Game_State to all Game_Clients in the Room within 500 milliseconds.
2. THE Game_Client SHALL render the received Game_State to update the game board, player caravans, card rows, and turn indicator.
3. WHILE it is not a player's turn, THE Game_Client SHALL disable action controls for that player.
4. WHEN a turn ends, THE Game_Server SHALL advance the current player index and broadcast the updated Game_State.
5. THE Game_Client SHALL display a visual indicator showing which player's turn it is.

### Requirement 5: Server-Authoritative Game Logic

**User Story:** As a player, I want the server to validate all moves, so that no player can cheat or submit invalid actions.

#### Acceptance Criteria

1. WHEN a Game_Client sends a game action, THE Game_Server SHALL validate the action using GameEngine.validateAction before executing it.
2. IF a Game_Client sends an invalid action, THEN THE Game_Server SHALL reject the action and send an error message to the originating Game_Client without modifying the Game_State.
3. THE Game_Server SHALL be the sole authority for Game_State transitions; Game_Clients SHALL NOT modify Game_State locally for multiplayer games.
4. WHEN a game action is validated and executed, THE Game_Server SHALL use GameEngine.executeAction to compute the new Game_State.
5. IF a Game_Client sends an action and it is not that player's turn, THEN THE Game_Server SHALL reject the action with an error indicating it is not the player's turn.

### Requirement 6: WebSocket Communication

**User Story:** As a player, I want a persistent real-time connection to the game server, so that I receive updates instantly without page refreshes.

#### Acceptance Criteria

1. WHEN a Game_Client connects to the Game_Server, THE Game_Server SHALL establish a WebSocket_Connection using the Socket.IO library.
2. THE Game_Server SHALL use event-based messaging with defined event names for room operations (create, join, leave), game actions (action, state-update), and system events (error, disconnect).
3. WHILE a WebSocket_Connection is active, THE Game_Server SHALL send heartbeat pings to detect disconnections.
4. THE Game_Client SHALL include the Socket.IO client library bundled with the frontend build, requiring no additional software installation by the player.

### Requirement 7: Disconnection and Reconnection Handling

**User Story:** As a player, I want to be able to rejoin a game if I lose my connection, so that a temporary network issue does not ruin the match.

#### Acceptance Criteria

1. WHEN a player's WebSocket_Connection drops during an active game, THE Game_Server SHALL retain the player's seat in the Room for the duration of the Reconnection_Window (default: 120 seconds).
2. WHILE a player is disconnected, THE Game_Server SHALL notify all other Game_Clients in the Room that the player has disconnected.
3. WHEN a disconnected player reconnects within the Reconnection_Window, THE Game_Server SHALL restore the player's session and send the current Game_State to the reconnected Game_Client.
4. IF a player does not reconnect within the Reconnection_Window, THEN THE Game_Server SHALL remove the player from the Room and notify remaining Game_Clients.
5. WHILE a disconnected player's turn is active, THE Game_Server SHALL pause the turn timer (if applicable) and display a waiting message to other Game_Clients.

### Requirement 8: Game Completion in Multiplayer

**User Story:** As a player, I want the game to end correctly and show final scores, so that we know who won the multiplayer match.

#### Acceptance Criteria

1. WHEN GameEngine.isGameOver returns true after a game action, THE Game_Server SHALL calculate final scores using GameEngine.calculateFinalScores and broadcast the results to all Game_Clients.
2. THE Game_Client SHALL display the final scores, winner, and a breakdown of points (point cards, coins, remaining spices) to all players.
3. WHEN the game ends, THE Game_Server SHALL transition the Room to a "completed" state and release resources after a configurable timeout.
4. WHEN the game ends, THE Game_Client SHALL offer the Host an option to return to the Lobby to start a new game with the same players.

### Requirement 9: Single-Player Mode Preservation

**User Story:** As a player, I want the existing single-player mode to remain fully functional, so that I can still play against AI opponents.

#### Acceptance Criteria

1. THE Game_Client SHALL retain the existing main menu with "New Game" (single-player vs AI) functionality unchanged.
2. WHEN a player starts a single-player game, THE Game_Client SHALL use the local GameEngine and gameReducer without connecting to the Game_Server.
3. THE Game_Client SHALL add a "Multiplayer" option to the main menu alongside the existing single-player options.
4. THE Game_Client SHALL not require a Game_Server connection to play single-player games.

### Requirement 10: Cross-Network Play and Browser-Only Access

**User Story:** As a player, I want to play with friends on different WiFi networks using only a browser, so that no extra software or local network setup is required.

#### Acceptance Criteria

1. THE Game_Server SHALL be accessible over the public internet via HTTPS and WSS (WebSocket Secure) protocols.
2. THE Game_Client SHALL connect to the Game_Server using the WSS protocol to ensure compatibility with firewalls and corporate networks.
3. THE Game_Client SHALL function entirely within a modern web browser (Chrome, Firefox, Safari, Edge) without requiring plugins, extensions, or additional software downloads.
4. THE Game_Server SHALL be deployable to a Free_Hosting_Tier provider (Render.com, Railway, or Fly.io) with configuration suitable for free-tier resource limits.

### Requirement 11: Server Architecture and Deployment

**User Story:** As a developer, I want a lightweight server that is easy to deploy and maintain, so that the multiplayer backend runs reliably on free hosting.

#### Acceptance Criteria

1. THE Game_Server SHALL be implemented as a Node.js application using the Express framework for HTTP endpoints and Socket.IO for WebSocket communication.
2. THE Game_Server SHALL reuse the existing GameEngine class for all game logic (validation, execution, scoring) without duplicating game rules.
3. THE Game_Server SHALL store Room and Game_State data in-memory (no external database required for the initial version).
4. THE Game_Server SHALL expose a health-check HTTP endpoint that returns the server status.
5. THE Game_Server SHALL include environment-variable-based configuration for port, allowed origins (CORS), and Reconnection_Window duration.
6. THE Game_Server SHALL clean up inactive Rooms (no connected players for more than 10 minutes) to prevent memory leaks.

### Requirement 12: Player Identity and Profile

**User Story:** As a player, I want to set a display name and choose a character icon before joining a game, so that other players can easily identify me.

#### Acceptance Criteria

1. WHEN a player creates or joins a Room, THE Game_Client SHALL display a profile setup screen prompting the player to enter a display name and select a character icon.
2. THE Game_Client SHALL validate that the display name is between 1 and 20 characters and contains only alphanumeric characters, spaces, and common punctuation.
3. THE Game_Client SHALL present a list of predefined character icons (at least 8 distinct icons) for the player to choose from.
4. IF a player does not provide a display name, THEN THE Game_Client SHALL assign a default name in the format "Player N" where N is the player's join order.
5. IF a player does not select a character icon, THEN THE Game_Client SHALL assign a default icon.
6. THE Game_Server SHALL associate the display name and selected character icon with the player's session and include both in all player list broadcasts.
7. THE Game_Client SHALL display each player's chosen character icon alongside their name in the Lobby, the in-game opponent panel, and the turn indicator.
