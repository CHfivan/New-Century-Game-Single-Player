/**
 * GameController — handles game lifecycle: start, action processing,
 * turn advancement, game-over detection, disconnect/reconnect.
 */

import { GameEngine } from '../../src/engine/index.js'
import { getStartingSpices } from '../../src/types/config.js'
import type { GameState, GameAction } from '../../src/types/index.js'
import type { Room, RoomPlayer } from './RoomManager.js'
import type { ServerConfig } from './config.js'

export class GameController {
  private config: ServerConfig

  constructor(config: ServerConfig) {
    this.config = config
  }

  /**
   * Initialize a new game for the given room.
   * Creates a GameState via GameEngine, patches player names/icons from the
   * room's player list, stores the state on the room, and flips status to 'playing'.
   */
  startGame(room: Room): GameState {
    if (room.status !== 'lobby') {
      throw new Error('Game can only be started from the lobby.')
    }

    if (room.players.length < 2) {
      throw new Error('At least 2 players are required to start a game.')
    }

    const playerCount = room.players.length

    // Create game — multiplayer uses 0 AI players
    const gameState = GameEngine.createGame(playerCount, 0)

    // Build the spice tier assignments: index 0 = 3Y, index 1-2 = 4Y, index 3-4 = 3Y+1R
    // These are the tiers that GameEngine already assigned to gameState.players[0..N-1]
    // We need to randomly assign these tiers to room players, then sort by tier for turn order.

    // Create an array of {roomPlayerIndex, spiceTier} where tier 0 = 3Y (first), 1 = 4Y, 2 = 3Y+1R
    const tierForSeat = (seat: number): number => {
      if (seat === 0) return 0  // 3Y — goes first
      if (seat <= 2) return 1   // 4Y — goes second/third
      return 2                  // 3Y+1R — goes fourth/fifth
    }

    // Create seat assignments [0, 1, 2, ...] and shuffle them
    const seats = Array.from({ length: playerCount }, (_, i) => i)
    for (let i = seats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seats[i], seats[j]] = [seats[j]!, seats[i]!]
    }

    // seats[i] = the seat number assigned to room player i
    // Sort room players by their assigned tier (lower tier = earlier turn)
    // Within the same tier, randomize order
    const playerAssignments = room.players.map((rp, i) => ({
      roomPlayer: rp,
      assignedSeat: seats[i]!,
      tier: tierForSeat(seats[i]!),
    }))

    // Sort by tier (0 first, then 1, then 2), with random tiebreaking within same tier
    playerAssignments.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return Math.random() - 0.5
    })

    // Reorder room.players to match the sorted turn order
    room.players = playerAssignments.map((pa, i) => {
      pa.roomPlayer.playerIndex = i
      return pa.roomPlayer
    })

    // Now patch the game state: assign each player their name, AI status, and the correct spices
    for (let i = 0; i < playerCount; i++) {
      const assignment = playerAssignments[i]!
      const enginePlayer = gameState.players[i]!
      enginePlayer.name = assignment.roomPlayer.name

      // Assign the spices from the original seat assignment
      // (GameEngine already created spices for seat 0, 1, 2, etc.)
      // We need to use getStartingSpices with the assigned seat
      const seatSpices = getStartingSpices(assignment.assignedSeat, playerCount)
      enginePlayer.caravan = seatSpices

      if (assignment.roomPlayer.isAI) {
        enginePlayer.isAI = true
        enginePlayer.aiDifficulty = assignment.roomPlayer.aiDifficulty
      }
    }

    room.gameState = gameState
    room.status = 'playing'
    room.lastActivityAt = Date.now()

    return gameState
  }

  /**
   * Validate and execute a game action submitted by a player.
   * The host can also submit actions on behalf of AI players (client-side AI).
   *
   * @returns The updated GameState after the action is applied.
   * @throws If the session token doesn't match the current player (or host
   *         acting for an AI), or the action is invalid per GameEngine rules.
   */
  processAction(room: Room, sessionToken: string, action: GameAction): GameState {
    if (!room.gameState) {
      throw new Error('Game has not started yet.')
    }

    if (room.status !== 'playing') {
      throw new Error('Game is not in progress.')
    }

    const gameState = room.gameState as GameState

    // Resolve the room player from the session token
    const roomPlayer = room.players.find((p) => p.sessionToken === sessionToken)
    if (!roomPlayer) {
      throw new Error('Invalid session token.')
    }

    // Check if this is the current player's turn
    const currentRoomPlayer = room.players[gameState.currentPlayerIndex]
    if (!currentRoomPlayer) {
      throw new Error('Current player not found.')
    }

    if (currentRoomPlayer.isAI) {
      // AI turns: only the host can submit actions on behalf of AI players
      if (sessionToken !== room.hostSessionToken) {
        throw new Error('Only the host can submit AI actions.')
      }
    } else {
      // Human turns: must be the player's own turn
      if (roomPlayer.playerIndex !== gameState.currentPlayerIndex) {
        throw new Error('It is not your turn.')
      }
    }

    // Validate the action via the engine
    const validation = GameEngine.validateAction(gameState, action)
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid action.')
    }

    // Execute the action
    const newState = GameEngine.executeAction(gameState, action)

    // Only advance turn if the player's caravan is within capacity (≤10).
    // If overflow, the player must discard first — turn stays on them.
    const currentPlayer = newState.players[newState.currentPlayerIndex]
    const caravanTotal = currentPlayer
      ? currentPlayer.caravan.yellow + currentPlayer.caravan.red +
        currentPlayer.caravan.green + currentPlayer.caravan.brown
      : 0

    if (caravanTotal <= 10) {
      // Advance turn
      const nextPlayerIndex =
        (newState.currentPlayerIndex + 1) % newState.players.length
      newState.currentPlayerIndex = nextPlayerIndex
      newState.turnNumber = gameState.turnNumber + 1

      // Check for game over
      if (GameEngine.isGameOver(newState)) {
        const finalPlayers = GameEngine.calculateFinalScores(newState)
        newState.players = finalPlayers
        newState.gamePhase = 'ended'
        newState.winner = 0
        room.status = 'completed'
      }
    }
    // If caravan > 10, turn stays on current player — they must discard via game:discard

    // Persist updated state
    room.gameState = newState
    room.lastActivityAt = Date.now()

    return newState
  }

  /**
   * Reset a room back to lobby state so players can start another game.
   */
  resetToLobby(room: Room): void {
    room.gameState = null
    room.status = 'lobby'
    room.lastActivityAt = Date.now()
  }

  /**
   * Mark a player as disconnected and record the reconnection deadline.
   */
  handleDisconnect(room: Room, sessionToken: string): void {
    const roomPlayer = room.players.find((p) => p.sessionToken === sessionToken)
    if (!roomPlayer) return

    // Clear the socket association
    roomPlayer.socketId = null

    const now = Date.now()
    room.disconnectedPlayers.set(sessionToken, {
      sessionToken,
      disconnectedAt: now,
      reconnectionDeadline: now + this.config.RECONNECTION_WINDOW_MS,
    })

    room.lastActivityAt = now
  }

  /**
   * Restore a reconnecting player's session and return the current GameState.
   *
   * @returns The current GameState so the client can re-render.
   * @throws If the room has no active game.
   */
  handleReconnect(room: Room, sessionToken: string): GameState {
    if (!room.gameState) {
      throw new Error('No active game to reconnect to.')
    }

    // Remove from disconnected tracking (RoomManager.reconnect already
    // validates the window, so if we get here the token is valid).
    room.disconnectedPlayers.delete(sessionToken)
    room.lastActivityAt = Date.now()

    return room.gameState as GameState
  }
}
