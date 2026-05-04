/**
 * RoomManager — manages room lifecycle: creation, joining, leaving, reconnection, cleanup.
 */

import crypto from 'node:crypto'
import type { ServerConfig } from './config.js'

// ── Data Models ──────────────────────────────────────────────────────────────

export interface Room {
  roomCode: string
  status: 'lobby' | 'playing' | 'completed'
  hostSessionToken: string
  players: RoomPlayer[]
  gameState: GameStateRef | null
  createdAt: number
  lastActivityAt: number
  disconnectedPlayers: Map<string, DisconnectedPlayer>
}

export interface RoomPlayer {
  sessionToken: string
  socketId: string | null
  name: string
  icon: string
  playerIndex: number
  joinedAt: number
  isAI?: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

export interface DisconnectedPlayer {
  sessionToken: string
  disconnectedAt: number
  reconnectionDeadline: number
}

/**
 * Opaque reference to game state — the actual GameState type is managed by
 * GameController. RoomManager only stores/retrieves it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GameStateRef = any

// ── Constants ────────────────────────────────────────────────────────────────

const ROOM_CODE_LENGTH = 6
const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const MAX_PLAYERS_PER_ROOM = 5

// ── RoomManager Class ────────────────────────────────────────────────────────

export class RoomManager {
  private rooms: Map<string, Room> = new Map()
  private config: ServerConfig

  constructor(config: ServerConfig) {
    this.config = config
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Create a new room. The creator becomes the host (player index 0).
   */
  createRoom(
    hostName: string,
    hostIcon: string
  ): { roomCode: string; sessionToken: string } {
    if (this.rooms.size >= this.config.MAX_ROOMS) {
      throw new Error(
        'Maximum number of concurrent rooms reached. Please try again later.'
      )
    }

    const roomCode = this.generateUniqueRoomCode()
    const sessionToken = crypto.randomUUID()
    const now = Date.now()

    const host: RoomPlayer = {
      sessionToken,
      socketId: null,
      name: hostName,
      icon: hostIcon,
      playerIndex: 0,
      joinedAt: now,
    }

    const room: Room = {
      roomCode,
      status: 'lobby',
      hostSessionToken: sessionToken,
      players: [host],
      gameState: null,
      createdAt: now,
      lastActivityAt: now,
      disconnectedPlayers: new Map(),
    }

    this.rooms.set(roomCode, room)
    return { roomCode, sessionToken }
  }

  /**
   * Join an existing room. Returns a session token for the new player.
   */
  joinRoom(
    roomCode: string,
    playerName: string,
    playerIcon: string
  ): { sessionToken: string } {
    const room = this.rooms.get(roomCode)

    if (!room) {
      throw new Error('Room not found.')
    }

    if (room.status !== 'lobby') {
      throw new Error('Game is already in progress.')
    }

    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      throw new Error('Room is full.')
    }

    const sessionToken = crypto.randomUUID()
    const now = Date.now()

    // Reject duplicate names
    const existingNames = new Set(room.players.map(p => p.name.toLowerCase()))
    if (existingNames.has(playerName.trim().toLowerCase())) {
      throw new Error('NAME_TAKEN')
    }

    const player: RoomPlayer = {
      sessionToken,
      socketId: null,
      name: playerName,
      icon: playerIcon,
      playerIndex: room.players.length,
      joinedAt: now,
    }

    room.players.push(player)
    room.lastActivityAt = now

    return { sessionToken }
  }

  /**
   * Remove a player from a room by session token.
   * If the room becomes empty, it is deleted.
   */
  leaveRoom(roomCode: string, sessionToken: string): void {
    const room = this.rooms.get(roomCode)
    if (!room) return

    room.players = room.players.filter((p) => p.sessionToken !== sessionToken)
    room.disconnectedPlayers.delete(sessionToken)
    room.lastActivityAt = Date.now()

    // Reassign player indices after removal
    room.players.forEach((p, i) => {
      p.playerIndex = i
    })

    if (room.players.length === 0) {
      this.rooms.delete(roomCode)
      return
    }

    // If the host left, promote the first remaining player
    if (room.hostSessionToken === sessionToken) {
      room.hostSessionToken = room.players[0].sessionToken
    }
  }

  /**
   * Reconnect a previously disconnected player using their session token.
   * Returns the room if reconnection succeeds, or null if the token is
   * invalid or the reconnection window has expired.
   */
  reconnect(roomCode: string, sessionToken: string): Room | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const disconnected = room.disconnectedPlayers.get(sessionToken)
    if (!disconnected) {
      // Check if the player is still in the room (maybe never marked disconnected)
      const player = room.players.find((p) => p.sessionToken === sessionToken)
      return player ? room : null
    }

    const now = Date.now()
    if (now > disconnected.reconnectionDeadline) {
      // Window expired — remove the disconnected entry
      room.disconnectedPlayers.delete(sessionToken)
      return null
    }

    // Restore the player
    room.disconnectedPlayers.delete(sessionToken)
    room.lastActivityAt = now

    return room
  }

  /**
   * Get a room by code, or undefined if it doesn't exist.
   */
  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode)
  }

  /**
   * Add an AI player to a room. Only allowed in lobby status and when under the player cap.
   */
  addAIPlayer(
    roomCode: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): RoomPlayer[] {
    const room = this.rooms.get(roomCode)
    if (!room) throw new Error('Room not found.')
    if (room.status !== 'lobby') throw new Error('Can only add AI players in the lobby.')
    if (room.players.length >= MAX_PLAYERS_PER_ROOM) throw new Error('Room is full.')

    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    const now = Date.now()

    const aiPlayer: RoomPlayer = {
      sessionToken: `ai-${crypto.randomUUID()}`,
      socketId: null,
      name: `AI (${difficultyLabel})`,
      icon: '🤖',
      playerIndex: room.players.length,
      joinedAt: now,
      isAI: true,
      aiDifficulty: difficulty,
    }

    room.players.push(aiPlayer)
    room.lastActivityAt = now

    return room.players
  }

  /**
   * Remove an AI player from a room by player index. Only AI players can be removed this way.
   */
  removeAIPlayer(roomCode: string, playerIndex: number): RoomPlayer[] {
    const room = this.rooms.get(roomCode)
    if (!room) throw new Error('Room not found.')
    if (room.status !== 'lobby') throw new Error('Can only remove AI players in the lobby.')

    const player = room.players[playerIndex]
    if (!player) throw new Error('Player not found.')
    if (!player.isAI) throw new Error('Can only remove AI players.')

    room.players.splice(playerIndex, 1)

    // Reassign player indices
    room.players.forEach((p, i) => {
      p.playerIndex = i
    })

    room.lastActivityAt = Date.now()

    return room.players
  }

  /**
   * Rename an AI player in a room. Only AI players can be renamed this way.
   */
  renameAIPlayer(roomCode: string, playerIndex: number, newName: string): RoomPlayer[] {
    const room = this.rooms.get(roomCode)
    if (!room) throw new Error('Room not found.')
    if (room.status !== 'lobby') throw new Error('Can only rename AI players in the lobby.')

    const player = room.players[playerIndex]
    if (!player) throw new Error('Player not found.')
    if (!player.isAI) throw new Error('Can only rename AI players.')

    const trimmed = newName.trim()
    if (trimmed.length === 0) throw new Error('Name cannot be empty.')
    if (trimmed.length > 20) throw new Error('Name is too long (max 20 characters).')

    player.name = trimmed
    room.lastActivityAt = Date.now()

    return room.players
  }

  /**
   * Remove rooms that have had no connected players for longer than
   * STALE_ROOM_TIMEOUT_MS.
   */
  cleanupStaleRooms(): void {
    const now = Date.now()

    for (const [code, room] of this.rooms) {
      const hasConnectedPlayers = room.players.some(
        (p) => p.socketId !== null
      )

      if (!hasConnectedPlayers) {
        const elapsed = now - room.lastActivityAt
        if (elapsed > this.config.STALE_ROOM_TIMEOUT_MS) {
          this.rooms.delete(code)
        }
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Expose the rooms map size for testing / monitoring. */
  get roomCount(): number {
    return this.rooms.size
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private generateUniqueRoomCode(): string {
    let code: string
    do {
      code = this.generateRoomCode()
    } while (this.rooms.has(code))
    return code
  }

  private generateRoomCode(): string {
    let code = ''
    const bytes = crypto.randomBytes(ROOM_CODE_LENGTH)
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[bytes[i] % ROOM_CODE_CHARS.length]
    }
    return code
  }
}
