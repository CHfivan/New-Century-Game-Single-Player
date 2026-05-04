/**
 * Multiplayer type definitions for Century: Spice Road
 * Shared between client components and server (via path aliases).
 */

import type { GameState, GameAction } from './game'

// ── Client-Side Lobby Player (sent over wire) ───────────────────────────────

export interface LobbyPlayer {
  name: string
  icon: string
  isHost: boolean
  connected: boolean
  isAI?: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

// ── Socket.IO Event Payloads — Client → Server ─────────────────────────────

export interface CreateRoomPayload {
  playerName: string
  icon: string
}

export interface JoinRoomPayload {
  roomCode: string
  playerName: string
  icon: string
}

export interface ReconnectPayload {
  roomCode: string
  sessionToken: string
}

export interface GameActionPayload {
  action: GameAction
}

// ── Socket.IO Event Payloads — Server → Client ─────────────────────────────

export interface RoomCreatedPayload {
  roomCode: string
  sessionToken: string
  inviteLink: string
}

export interface RoomJoinedPayload {
  sessionToken: string
  players: LobbyPlayer[]
}

export interface PlayerJoinedPayload {
  players: LobbyPlayer[]
}

export interface PlayerLeftPayload {
  players: LobbyPlayer[]
  leftPlayerName: string
}

export interface StateUpdatePayload {
  gameState: GameState
  action?: GameAction    // The action that was performed (absent for initial state)
  playerIndex?: number   // Who performed the action
}

export interface GameErrorPayload {
  message: string
}

export interface PlayerDisconnectedPayload {
  playerName: string
  reconnectionDeadline: number
}

export interface PlayerReconnectedPayload {
  playerName: string
}

export interface ScoreBreakdown {
  pointCards: number
  goldCoins: number
  silverCoins: number
  remainingSpices: number
}

export interface GameOverPayload {
  finalScores: Array<{ name: string; score: number; breakdown: ScoreBreakdown }>
}
