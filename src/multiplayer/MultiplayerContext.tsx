/**
 * React context and provider for multiplayer state management.
 * Manages Socket.IO connection lifecycle, room state, and game state
 * received from the authoritative server.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket } from './socketClient'
import type { GameState, GameAction } from '../types/game'
import type {
  LobbyPlayer,
  RoomCreatedPayload,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  StateUpdatePayload,
  GameErrorPayload,
  PlayerDisconnectedPayload,
  PlayerReconnectedPayload,
} from '../types/multiplayer'

// ── Context value interface ─────────────────────────────────────────────────

export interface MultiplayerContextValue {
  // Connection
  socket: Socket | null
  connected: boolean

  // Room state
  roomCode: string | null
  players: LobbyPlayer[]
  isHost: boolean
  sessionToken: string | null

  // Game state (received from server)
  gameState: GameState | null
  myPlayerIndex: number | null
  isMyTurn: boolean

  // Last action received from server (for remote animation triggering)
  lastAction: GameAction | null
  lastActionPlayerIndex: number | null

  // Actions
  createRoom: (playerName: string, icon: string) => void
  joinRoom: (roomCode: string, playerName: string, icon: string) => void
  leaveRoom: () => void
  startGame: () => void
  sendAction: (action: GameAction) => void
  sendDiscard: (toDiscard: { yellow: number; red: number; green: number; brown: number }) => void
  attemptReconnect: () => boolean  // Returns true if a saved session was found
  restartGame: () => void
  addAI: (difficulty: 'easy' | 'medium' | 'hard') => void
  removeAI: (playerIndex: number) => void
  renameAI: (playerIndex: number, newName: string) => void

  // Status
  error: string | null
  disconnectedPlayers: string[]
}

const MultiplayerContext = createContext<MultiplayerContextValue | undefined>(undefined)

// ── Session storage helpers ─────────────────────────────────────────────────

const SESSION_TOKEN_KEY = 'multiplayer-session-token'
const ROOM_CODE_KEY = 'multiplayer-room-code'
const PLAYER_NAME_KEY = 'multiplayer-player-name'

function saveSession(sessionToken: string, roomCode: string, name?: string): void {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, sessionToken)
    sessionStorage.setItem(ROOM_CODE_KEY, roomCode)
    if (name) sessionStorage.setItem(PLAYER_NAME_KEY, name)
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

function loadSession(): { sessionToken: string | null; roomCode: string | null; playerName: string | null } {
  try {
    return {
      sessionToken: sessionStorage.getItem(SESSION_TOKEN_KEY),
      roomCode: sessionStorage.getItem(ROOM_CODE_KEY),
      playerName: sessionStorage.getItem(PLAYER_NAME_KEY),
    }
  } catch {
    return { sessionToken: null, roomCode: null, playerName: null }
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    sessionStorage.removeItem(ROOM_CODE_KEY)
    sessionStorage.removeItem(PLAYER_NAME_KEY)
  } catch {
    // ignore
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

interface MultiplayerProviderProps {
  children: React.ReactNode
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  // Room state
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null)
  const [isMyTurn, setIsMyTurn] = useState(false)

  // Last action received from server (for remote animation triggering)
  const [lastAction, setLastAction] = useState<GameAction | null>(null)
  const [lastActionPlayerIndex, setLastActionPlayerIndex] = useState<number | null>(null)

  // Status
  const [error, setError] = useState<string | null>(null)
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<string[]>([])

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Store our player name for index lookup
  const playerName = useRef<string | null>(null)
  // Track roomCode in a ref for use in event callbacks
  const roomCodeRef = useRef<string | null>(null)

  // ── Connect socket on mount, clean up listeners on unmount ──────────────

  useEffect(() => {
    const s = getSocket()
    setSocket(s)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    // If already connected (singleton may already be live)
    if (s.connected) {
      setConnected(true)
    }

    // ── Server event listeners ──────────────────────────────────────────

    const onRoomCreated = (payload: RoomCreatedPayload & { players?: LobbyPlayer[] }) => {
      setRoomCode(payload.roomCode)
      setSessionToken(payload.sessionToken)
      setIsHost(true)
      if (payload.players) {
        setPlayers(payload.players)
      }
      roomCodeRef.current = payload.roomCode
      saveSession(payload.sessionToken, payload.roomCode, playerName.current ?? undefined)
    }

    const onRoomJoined = (payload: RoomJoinedPayload) => {
      setSessionToken(payload.sessionToken)
      setPlayers(payload.players)
      // Save session for reconnection — roomCode was set by joinRoom() in the ref
      if (roomCodeRef.current) {
        saveSession(payload.sessionToken, roomCodeRef.current, playerName.current ?? undefined)
      }
    }

    const onPlayerJoined = (payload: PlayerJoinedPayload) => {
      setPlayers(payload.players)
    }

    const onPlayerLeft = (payload: PlayerLeftPayload) => {
      setPlayers(payload.players)
    }

    const onStateUpdate = (payload: StateUpdatePayload) => {
      setGameState(payload.gameState)
      // Store the action and who performed it (if present) for animation triggering
      if (payload.action && payload.playerIndex !== undefined) {
        setLastAction(payload.action)
        setLastActionPlayerIndex(payload.playerIndex)
      } else {
        setLastAction(null)
        setLastActionPlayerIndex(null)
      }
    }

    const onGameError = (payload: GameErrorPayload) => {
      setError(payload.message)
      // Auto-clear error after 5 seconds
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setError(null), 5000)
    }

    const onPlayerDisconnected = (payload: PlayerDisconnectedPayload) => {
      setDisconnectedPlayers((prev) =>
        prev.includes(payload.playerName) ? prev : [...prev, payload.playerName]
      )
    }

    const onPlayerReconnected = (payload: PlayerReconnectedPayload) => {
      setDisconnectedPlayers((prev) => prev.filter((n) => n !== payload.playerName))
    }

    const onGameRestarted = (payload: { players: LobbyPlayer[] }) => {
      // Reset game state — go back to lobby
      setGameState(null)
      setMyPlayerIndex(null)
      setIsMyTurn(false)
      setLastAction(null)
      setLastActionPlayerIndex(null)
      setDisconnectedPlayers([])
      setPlayers(payload.players)
    }

    s.on('room:created', onRoomCreated)
    s.on('room:joined', onRoomJoined)
    s.on('room:player-joined', onPlayerJoined)
    s.on('room:player-left', onPlayerLeft)
    s.on('game:state-update', onStateUpdate)
    s.on('game:error', onGameError)
    s.on('room:player-disconnected', onPlayerDisconnected)
    s.on('room:player-reconnected', onPlayerReconnected)
    s.on('game:restarted', onGameRestarted)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('room:created', onRoomCreated)
      s.off('room:joined', onRoomJoined)
      s.off('room:player-joined', onPlayerJoined)
      s.off('room:player-left', onPlayerLeft)
      s.off('game:state-update', onStateUpdate)
      s.off('game:error', onGameError)
      s.off('room:player-disconnected', onPlayerDisconnected)
      s.off('room:player-reconnected', onPlayerReconnected)
      s.off('game:restarted', onGameRestarted)

      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  // ── Compute myPlayerIndex and isMyTurn when gameState changes ─────────

  useEffect(() => {
    if (!gameState || !sessionToken) {
      setMyPlayerIndex(null)
      setIsMyTurn(false)
      return
    }

    // Match our stored playerName against gameState.players to find our seat
    const idx = findMyPlayerIndex(gameState, playerName.current)
    setMyPlayerIndex(idx)
    setIsMyTurn(idx !== null && idx === gameState.currentPlayerIndex)
  }, [gameState, sessionToken])

  // ── Action methods ────────────────────────────────────────────────────────

  const createRoom = useCallback(
    (name: string, icon: string) => {
      if (!socket) return
      playerName.current = name
      socket.emit('room:create', { playerName: name, icon })
    },
    [socket]
  )

  const joinRoom = useCallback(
    (code: string, name: string, icon: string) => {
      if (!socket) return
      playerName.current = name
      roomCodeRef.current = code
      setRoomCode(code)
      socket.emit('room:join', { roomCode: code, playerName: name, icon })
    },
    [socket]
  )

  const leaveRoom = useCallback(() => {
    if (!socket) return
    socket.emit('room:leave')
    // Reset local state
    setRoomCode(null)
    setPlayers([])
    setIsHost(false)
    setSessionToken(null)
    setGameState(null)
    setMyPlayerIndex(null)
    setIsMyTurn(false)
    setLastAction(null)
    setLastActionPlayerIndex(null)
    setDisconnectedPlayers([])
    setError(null)
    playerName.current = null
    roomCodeRef.current = null
    clearSession()
  }, [socket])

  const startGame = useCallback(() => {
    if (!socket) return
    socket.emit('game:start')
  }, [socket])

  const sendAction = useCallback(
    (action: GameAction) => {
      if (!socket) return
      socket.emit('game:action', { action })
    },
    [socket]
  )

  const sendDiscard = useCallback(
    (toDiscard: { yellow: number; red: number; green: number; brown: number }) => {
      if (!socket) return
      socket.emit('game:discard', { toDiscard })
    },
    [socket]
  )

  const attemptReconnect = useCallback((): boolean => {
    if (!socket) return false
    const saved = loadSession()
    if (!saved.sessionToken || !saved.roomCode) return false

    // Restore player name ref so myPlayerIndex lookup works
    if (saved.playerName) {
      playerName.current = saved.playerName
    }

    setRoomCode(saved.roomCode)
    setSessionToken(saved.sessionToken)
    roomCodeRef.current = saved.roomCode

    socket.emit('room:reconnect', {
      roomCode: saved.roomCode,
      sessionToken: saved.sessionToken,
    })

    return true
  }, [socket])

  const restartGame = useCallback(() => {
    if (!socket) return
    socket.emit('game:restart')
  }, [socket])

  const addAI = useCallback(
    (difficulty: 'easy' | 'medium' | 'hard') => {
      if (!socket) return
      socket.emit('room:add-ai', { difficulty })
    },
    [socket]
  )

  const removeAI = useCallback(
    (playerIndex: number) => {
      if (!socket) return
      socket.emit('room:remove-ai', { playerIndex })
    },
    [socket]
  )

  const renameAI = useCallback(
    (playerIndex: number, newName: string) => {
      if (!socket) return
      socket.emit('room:rename-ai', { playerIndex, newName })
    },
    [socket]
  )

  // ── Context value ─────────────────────────────────────────────────────────

  const value: MultiplayerContextValue = {
    socket,
    connected,
    roomCode,
    players,
    isHost,
    sessionToken,
    gameState,
    myPlayerIndex,
    isMyTurn,
    lastAction,
    lastActionPlayerIndex,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendAction,
    sendDiscard,
    attemptReconnect,
    restartGame,
    addAI,
    removeAI,
    renameAI,
    error,
    disconnectedPlayers,
  }

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  )
}

// ── Helper ──────────────────────────────────────────────────────────────────

function findMyPlayerIndex(gameState: GameState, name: string | null): number | null {
  if (!name) return null
  const idx = gameState.players.findIndex((p) => p.name === name)
  return idx >= 0 ? idx : null
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useMultiplayer(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext)
  if (ctx === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider')
  }
  return ctx
}
