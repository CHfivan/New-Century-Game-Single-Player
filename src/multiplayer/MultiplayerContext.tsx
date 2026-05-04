/**
 * React context and provider for multiplayer state management.
 *
 * Uses PeerJS (WebRTC data channels) for peer-to-peer communication.
 * The HOST's browser acts as the authoritative game server:
 *   - Manages room state (players, lobby)
 *   - Runs the GameEngine to validate/execute actions
 *   - Broadcasts state updates to all connected peers
 *
 * NON-HOST players send actions to the host and receive state updates.
 *
 * The public MultiplayerContextValue interface is UNCHANGED so all
 * downstream components (Lobby, MultiplayerGameBoard, MultiplayerMenu,
 * ProfileSetup, Demo) continue to work without modification.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import Peer, { DataConnection } from 'peerjs'
import {
  generateRoomCode,
  createHostPeer,
  createClientPeer,
} from './peerClient'
import type { ClientMessage, HostMessage } from './peerClient'
import { GameEngine } from '../engine'
import { getStartingSpices } from '../types/config'
import type { GameState, GameAction } from '../types/game'
import type { LobbyPlayer } from '../types/multiplayer'

// ── Helper: sanitize game state for PeerJS serialization ────────────────────
// PeerJS can't serialize Map objects. Convert any Maps to plain objects.
function sanitizeForSend(gs: GameState): GameState {
  return {
    ...gs,
    players: gs.players.map(p => ({
      ...p,
      statistics: p.statistics ? {
        ...p.statistics,
        cardUsageCount: p.statistics.cardUsageCount instanceof Map
          ? Object.fromEntries(p.statistics.cardUsageCount) as any
          : p.statistics.cardUsageCount,
      } : p.statistics,
    })),
  }
}

// ── Context value interface (UNCHANGED) ─────────────────────────────────────

export interface MultiplayerContextValue {
  // Connection
  socket: null  // kept for interface compat — always null now
  connected: boolean

  // Room state
  roomCode: string | null
  players: LobbyPlayer[]
  isHost: boolean
  sessionToken: string | null

  // Game state (received from host / computed locally on host)
  gameState: GameState | null
  myPlayerIndex: number | null
  isMyTurn: boolean

  // Last action received (for remote animation triggering)
  lastAction: GameAction | null
  lastActionPlayerIndex: number | null

  // Actions
  createRoom: (playerName: string, icon: string) => void
  joinRoom: (roomCode: string, playerName: string, icon: string) => void
  leaveRoom: () => void
  startGame: () => void
  sendAction: (action: GameAction) => void
  sendDiscard: (toDiscard: { yellow: number; red: number; green: number; brown: number }) => void
  attemptReconnect: () => boolean
  rejoinRoom: (roomCode: string, name: string) => void
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
const IS_HOST_KEY = 'multiplayer-is-host'
const PLAYER_ICON_KEY = 'multiplayer-player-icon'

function saveSession(token: string, roomCode: string, name?: string, isHost?: boolean, icon?: string): void {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token)
    sessionStorage.setItem(ROOM_CODE_KEY, roomCode)
    if (name) sessionStorage.setItem(PLAYER_NAME_KEY, name)
    if (isHost !== undefined) sessionStorage.setItem(IS_HOST_KEY, isHost ? '1' : '0')
    if (icon) sessionStorage.setItem(PLAYER_ICON_KEY, icon)
  } catch { /* ignore */ }
}

function loadSession() {
  try {
    return {
      sessionToken: sessionStorage.getItem(SESSION_TOKEN_KEY),
      roomCode: sessionStorage.getItem(ROOM_CODE_KEY),
      playerName: sessionStorage.getItem(PLAYER_NAME_KEY),
      isHost: sessionStorage.getItem(IS_HOST_KEY) === '1',
      icon: sessionStorage.getItem(PLAYER_ICON_KEY),
    }
  } catch {
    return { sessionToken: null, roomCode: null, playerName: null, isHost: false, icon: null }
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    sessionStorage.removeItem(ROOM_CODE_KEY)
    sessionStorage.removeItem(PLAYER_NAME_KEY)
    sessionStorage.removeItem(IS_HOST_KEY)
    sessionStorage.removeItem(PLAYER_ICON_KEY)
  } catch { /* ignore */ }
}


// ── Internal types for host-side room management ────────────────────────────

interface RoomPlayer {
  clientId: string        // unique ID for this player (host uses 'host', peers use peerId)
  name: string
  icon: string
  playerIndex: number
  isAI?: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard'
  connection?: DataConnection  // undefined for host and AI players
}

const MAX_PLAYERS = 5

// ── Provider ────────────────────────────────────────────────────────────────

interface MultiplayerProviderProps {
  children: React.ReactNode
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  // Connection
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

  // Last action (for animation triggering)
  const [lastAction, setLastAction] = useState<GameAction | null>(null)
  const [lastActionPlayerIndex, setLastActionPlayerIndex] = useState<number | null>(null)

  // Status
  const [error, setError] = useState<string | null>(null)
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<string[]>([])

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs for mutable state accessed in callbacks
  const peerRef = useRef<Peer | null>(null)
  const playerName = useRef<string | null>(null)
  const playerIcon = useRef<string | null>(null)
  const roomCodeRef = useRef<string | null>(null)
  const isHostRef = useRef(false)

  // Host-only refs
  const roomPlayersRef = useRef<RoomPlayer[]>([])
  const gameStateRef = useRef<GameState | null>(null)
  const roomStatusRef = useRef<'lobby' | 'playing' | 'completed'>('lobby')
  const connectionsRef = useRef<DataConnection[]>([])

  // Client-only ref
  const hostConnectionRef = useRef<DataConnection | null>(null)

  // ── Helper: show error with auto-clear ────────────────────────────────

  const showError = useCallback((message: string) => {
    setError(message)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(null), 5000)
  }, [])

  // ── Helper: convert RoomPlayer[] to LobbyPlayer[] ────────────────────

  const toLobbyPlayers = useCallback((rps: RoomPlayer[]): LobbyPlayer[] => {
    return rps.map((rp, i) => ({
      name: rp.name,
      icon: rp.icon,
      isHost: i === 0 || rp.clientId === 'host',
      connected: rp.isAI ? true : rp.connection !== undefined || rp.clientId === 'host',
      isAI: rp.isAI,
      aiDifficulty: rp.aiDifficulty,
    }))
  }, [])

  // ── Helper: broadcast a message to all connected peers (host only) ────

  const broadcast = useCallback((msg: HostMessage) => {
    for (const conn of connectionsRef.current) {
      if (conn.open) {
        conn.send(msg)
      }
    }
  }, [])

  // ── Helper: broadcast lobby players update ────────────────────────────

  const broadcastPlayers = useCallback((type: 'player-joined' | 'player-left', leftPlayerName?: string) => {
    const lobbyPlayers = toLobbyPlayers(roomPlayersRef.current)
    setPlayers(lobbyPlayers)

    if (type === 'player-joined') {
      broadcast({ type: 'player-joined', players: lobbyPlayers })
    } else {
      broadcast({ type: 'player-left', players: lobbyPlayers, leftPlayerName: leftPlayerName ?? 'Unknown' })
    }
  }, [toLobbyPlayers, broadcast])


  // ── HOST: process game action (mirrors server GameController.processAction) ─

  const hostProcessAction = useCallback((action: GameAction, fromClientId: string) => {
    const gs = gameStateRef.current
    if (!gs || roomStatusRef.current !== 'playing') {
      return { error: 'Game has not started yet.' }
    }

    // Resolve the room player
    const roomPlayer = roomPlayersRef.current.find(rp => rp.clientId === fromClientId)
    const currentRoomPlayer = roomPlayersRef.current[gs.currentPlayerIndex]

    if (!currentRoomPlayer) return { error: 'Current player not found.' }

    if (currentRoomPlayer.isAI) {
      // AI turns: only the host can submit
      if (fromClientId !== 'host') {
        return { error: 'Only the host can submit AI actions.' }
      }
    } else {
      if (!roomPlayer) return { error: 'Player not found.' }
      if (roomPlayer.playerIndex !== gs.currentPlayerIndex) {
        return { error: 'It is not your turn.' }
      }
    }

    // Validate
    const validation = GameEngine.validateAction(gs, action)
    if (!validation.valid) {
      return { error: validation.error ?? 'Invalid action.' }
    }

    // Execute
    const newState = GameEngine.executeAction(gs, action)

    // Determine who performed the action
    const actingPlayerIndex = currentRoomPlayer.isAI
      ? gs.currentPlayerIndex
      : (roomPlayer?.playerIndex ?? gs.currentPlayerIndex)

    // Turn advancement logic (same as server GameController)
    const currentPlayer = newState.players[newState.currentPlayerIndex]
    const caravanTotal = currentPlayer
      ? currentPlayer.caravan.yellow + currentPlayer.caravan.red +
        currentPlayer.caravan.green + currentPlayer.caravan.brown
      : 0

    if (caravanTotal <= 10) {
      // Advance turn
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
      newState.turnNumber = gs.turnNumber + 1

      // Check for game over
      if (GameEngine.isGameOver(newState)) {
        const finalPlayers = GameEngine.calculateFinalScores(newState)
        newState.players = finalPlayers
        newState.gamePhase = 'ended'
        newState.winner = 0
        roomStatusRef.current = 'completed'
      }
    } else if (currentPlayer && currentRoomPlayer.isAI) {
      // AI overflow: auto-discard cheapest spices
      const excess = caravanTotal - 10
      let remaining = excess
      const order: Array<'yellow' | 'red' | 'green' | 'brown'> = ['yellow', 'red', 'green', 'brown']
      for (const spice of order) {
        if (remaining <= 0) break
        const canDiscard = Math.min(currentPlayer.caravan[spice], remaining)
        currentPlayer.caravan[spice] -= canDiscard
        remaining -= canDiscard
      }

      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length
      newState.turnNumber = gs.turnNumber + 1

      if (GameEngine.isGameOver(newState)) {
        const finalPlayers = GameEngine.calculateFinalScores(newState)
        newState.players = finalPlayers
        newState.gamePhase = 'ended'
        newState.winner = 0
        roomStatusRef.current = 'completed'
      }
    }
    // If caravan > 10 for human, turn stays — they must discard via sendDiscard

    gameStateRef.current = newState

    return { gameState: newState, actingPlayerIndex }
  }, [])

  // ── HOST: process discard (mirrors server SocketHandler game:discard) ──

  const hostProcessDiscard = useCallback((
    toDiscard: { yellow: number; red: number; green: number; brown: number },
    fromClientId: string
  ) => {
    const gs = gameStateRef.current
    if (!gs) return { error: 'No active game.' }

    const roomPlayer = roomPlayersRef.current.find(rp => rp.clientId === fromClientId)
    if (!roomPlayer) return { error: 'Player not found.' }

    const player = gs.players[roomPlayer.playerIndex]
    if (!player) return { error: 'Player not found in game state.' }

    // Apply discard
    player.caravan = {
      yellow: player.caravan.yellow - (toDiscard.yellow || 0),
      red: player.caravan.red - (toDiscard.red || 0),
      green: player.caravan.green - (toDiscard.green || 0),
      brown: player.caravan.brown - (toDiscard.brown || 0),
    }

    // Advance turn
    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length
    gs.turnNumber++
    gs.stateSnapshot = null

    gameStateRef.current = gs
    return { gameState: gs }
  }, [])


  // ── HOST: handle incoming message from a peer ─────────────────────────

  const hostHandleMessage = useCallback((msg: ClientMessage, conn: DataConnection) => {
    const clientId = conn.peer

    switch (msg.type) {
      case 'join': {
        if (roomStatusRef.current !== 'lobby') {
          const reply: HostMessage = { type: 'error', message: 'Game is already in progress.' }
          conn.send(reply)
          return
        }
        if (roomPlayersRef.current.length >= MAX_PLAYERS) {
          const reply: HostMessage = { type: 'error', message: 'Room is full.' }
          conn.send(reply)
          return
        }

        // Duplicate name check — reject if taken
        const existingNames = new Set(roomPlayersRef.current.map(rp => rp.name.toLowerCase()))
        const trimmedName = msg.name.trim()
        if (existingNames.has(trimmedName.toLowerCase())) {
          const reply: HostMessage = { type: 'error', message: 'NAME_TAKEN' }
          conn.send(reply)
          return
        }

        const newPlayer: RoomPlayer = {
          clientId,
          name: trimmedName,
          icon: msg.icon,
          playerIndex: roomPlayersRef.current.length,
          connection: conn,
        }
        roomPlayersRef.current = [...roomPlayersRef.current, newPlayer]
        connectionsRef.current = [...connectionsRef.current, conn]

        const lobbyPlayers = toLobbyPlayers(roomPlayersRef.current)
        setPlayers(lobbyPlayers)

        // Send joined confirmation to the new player
        const joinedMsg: HostMessage = {
          type: 'joined',
          players: lobbyPlayers,
        }
        conn.send(joinedMsg)

        // Broadcast updated player list to all OTHER peers
        for (const c of connectionsRef.current) {
          if (c !== conn && c.open) {
            c.send({ type: 'player-joined', players: lobbyPlayers } as HostMessage)
          }
        }
        break
      }

      case 'rejoin': {
        console.log('[Host] Rejoin request from:', msg.name)
        // Find the disconnected player by name
        const existingPlayer = roomPlayersRef.current.find(
          rp => rp.name.toLowerCase() === msg.name.toLowerCase() && !rp.connection && !rp.isAI
        )
        if (!existingPlayer) {
          conn.send({ type: 'error', message: 'No disconnected player found with that name.' } as HostMessage)
          return
        }

        // Restore the connection
        existingPlayer.connection = conn
        existingPlayer.clientId = clientId
        connectionsRef.current = [...connectionsRef.current, conn]

        // Remove from disconnected list
        setDisconnectedPlayers(prev => prev.filter(n => n !== existingPlayer.name))

        const lobbyPlayers = toLobbyPlayers(roomPlayersRef.current)
        setPlayers(lobbyPlayers)

        // Send the current game state to the rejoining player
        const gs = gameStateRef.current
        const rejoinMsg: HostMessage = {
          type: 'rejoined',
          gameState: gs ? sanitizeForSend(gs) : null as any,
          players: lobbyPlayers,
        }
        conn.send(rejoinMsg)

        // Notify other peers
        for (const c of connectionsRef.current) {
          if (c !== conn && c.open) {
            c.send({ type: 'player-joined', players: lobbyPlayers } as HostMessage)
          }
        }
        break
      }

      case 'action': {
        const result = hostProcessAction(msg.action as GameAction, clientId)
        if ('error' in result) {
          conn.send({ type: 'error', message: result.error } as HostMessage)
        } else {
          const stateMsg: HostMessage = {
            type: 'state-update',
            gameState: sanitizeForSend(result.gameState!),
            action: msg.action,
            playerIndex: result.actingPlayerIndex,
          }
          // Broadcast to all peers
          broadcast(stateMsg)
          // Update local state (host)
          setGameState(result.gameState!)
          setLastAction(msg.action as GameAction)
          setLastActionPlayerIndex(result.actingPlayerIndex!)
        }
        break
      }

      case 'discard': {
        const result = hostProcessDiscard(msg.toDiscard, clientId)
        if ('error' in result) {
          conn.send({ type: 'error', message: result.error } as HostMessage)
        } else {
          const stateMsg: HostMessage = { type: 'state-update', gameState: sanitizeForSend(result.gameState!) }
          broadcast(stateMsg)
          setGameState({ ...result.gameState! })
          setLastAction(null)
          setLastActionPlayerIndex(null)
        }
        break
      }

      case 'leave': {
        const leavingPlayer = roomPlayersRef.current.find(rp => rp.clientId === clientId)
        const leavingName = leavingPlayer?.name ?? 'Unknown'

        roomPlayersRef.current = roomPlayersRef.current.filter(rp => rp.clientId !== clientId)
        roomPlayersRef.current.forEach((rp, i) => { rp.playerIndex = i })
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn)

        broadcastPlayers('player-left', leavingName)
        setDisconnectedPlayers(prev => prev.filter(n => n !== leavingName))
        break
      }

      // These should only come from the host UI, but handle them for completeness
      case 'start-game':
      case 'restart':
      case 'add-ai':
      case 'remove-ai':
      case 'rename-ai':
        // Non-host peers shouldn't send these; ignore
        break
    }
  }, [toLobbyPlayers, broadcast, broadcastPlayers, hostProcessAction, hostProcessDiscard])


  // ── HOST: set up peer connection listener for a new connection ─────────

  const hostSetupConnection = useCallback((conn: DataConnection) => {
    conn.on('data', (data) => {
      hostHandleMessage(data as ClientMessage, conn)
    })

    conn.on('close', () => {
      const disconnectedPlayer = roomPlayersRef.current.find(rp => rp.connection === conn)
      if (disconnectedPlayer) {
        const name = disconnectedPlayer.name
        setDisconnectedPlayers(prev =>
          prev.includes(name) ? prev : [...prev, name]
        )

        // Keep the player slot but clear the connection — they can rejoin
        disconnectedPlayer.connection = undefined
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn)

        // Don't remove from roomPlayersRef or reindex — their seat is preserved
      }
    })
  }, [hostHandleMessage, broadcastPlayers])

  // ── CLIENT: handle incoming message from the host ─────────────────────

  const clientHandleMessage = useCallback((msg: HostMessage) => {
    switch (msg.type) {
      case 'joined':
        setPlayers(msg.players as LobbyPlayer[])
        setError(null) // Clear any previous errors (e.g., NAME_TAKEN from earlier attempt)
        // Now that host confirmed the join, set the room code to trigger lobby transition
        if (roomCodeRef.current) {
          setRoomCode(roomCodeRef.current)
        }
        break

      case 'rejoined':
        console.log('[Peer] Rejoined successfully, received game state')
        setPlayers(msg.players as LobbyPlayer[])
        if (roomCodeRef.current) {
          setRoomCode(roomCodeRef.current)
        }
        if (msg.gameState) {
          setGameState(msg.gameState as GameState)
        }
        break

      case 'player-joined':
        setPlayers(msg.players as LobbyPlayer[])
        break

      case 'player-left':
        setPlayers(msg.players as LobbyPlayer[])
        break

      case 'state-update':
        setGameState(msg.gameState as GameState)
        setError(null) // Clear any lingering errors when game state arrives
        if (msg.action && msg.playerIndex !== undefined) {
          setLastAction(msg.action as GameAction)
          setLastActionPlayerIndex(msg.playerIndex)
        } else {
          setLastAction(null)
          setLastActionPlayerIndex(null)
        }
        break

      case 'restarted':
        setGameState(null)
        setMyPlayerIndex(null)
        setIsMyTurn(false)
        setLastAction(null)
        setLastActionPlayerIndex(null)
        setDisconnectedPlayers([])
        setPlayers(msg.players as LobbyPlayer[])
        break

      case 'error':
        showError(msg.message)
        break

      case 'host-changed':
        setPlayers(msg.players as LobbyPlayer[])
        break
    }
  }, [showError])

  // ── Cleanup on unmount ────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  // ── Compute myPlayerIndex and isMyTurn when gameState changes ─────────

  useEffect(() => {
    if (!gameState) {
      setMyPlayerIndex(null)
      setIsMyTurn(false)
      return
    }

    const idx = findMyPlayerIndex(gameState, playerName.current)
    setMyPlayerIndex(idx)
    setIsMyTurn(idx !== null && idx === gameState.currentPlayerIndex)
  }, [gameState])


  // ── Action: createRoom ────────────────────────────────────────────────

  const createRoom = useCallback(async (name: string, icon: string) => {
    try {
      playerName.current = name
      playerIcon.current = icon
      isHostRef.current = true

      const code = generateRoomCode()
      roomCodeRef.current = code

      const peer = await createHostPeer(code)
      peerRef.current = peer

      // Host is player 0
      const hostPlayer: RoomPlayer = {
        clientId: 'host',
        name,
        icon,
        playerIndex: 0,
      }
      roomPlayersRef.current = [hostPlayer]
      roomStatusRef.current = 'lobby'

      const lobbyPlayers = toLobbyPlayers(roomPlayersRef.current)

      setRoomCode(code)
      setIsHost(true)
      setConnected(true)
      setPlayers(lobbyPlayers)
      setSessionToken('host')

      saveSession('host', code, name, true, icon)

      // Listen for incoming connections
      peer.on('connection', (conn) => {
        // Set up data listener immediately (before 'open') so we don't miss early messages
        hostSetupConnection(conn)
      })

      // Handle peer disconnection from signaling server
      peer.on('disconnected', () => {
        console.log('[Peer] Host disconnected from signaling server, attempting reconnect...')
        if (!peer.destroyed) {
          peer.reconnect()
        }
      })

      peer.on('error', (err) => {
        console.error('[Peer] Host peer error:', err)
        if (err.type !== 'peer-unavailable') {
          showError('Connection error. Please try again.')
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room.'
      showError(message)
    }
  }, [toLobbyPlayers, hostSetupConnection, showError])

  // ── Action: joinRoom ──────────────────────────────────────────────────

  const joinRoom = useCallback(async (code: string, name: string, icon: string) => {
    try {
      playerName.current = name
      playerIcon.current = icon
      isHostRef.current = false
      roomCodeRef.current = code

      // Don't set roomCode yet — wait for host to confirm the join
      // setRoomCode is called in clientHandleMessage when 'joined' arrives

      const { peer, connection } = await createClientPeer(code)
      peerRef.current = peer
      hostConnectionRef.current = connection

      setConnected(true)
      setIsHost(false)
      setSessionToken(peer.id)

      saveSession(peer.id, code, name, false, icon)

      // Send join message to host (small delay to ensure host has data listener ready)
      setTimeout(() => {
        const joinMsg: ClientMessage = { type: 'join', name, icon }
        connection.send(joinMsg)
      }, 200)

      // Listen for messages from host
      connection.on('data', (data) => {
        clientHandleMessage(data as HostMessage)
      })

      connection.on('close', () => {
        console.log('[Peer] Connection to host closed')
        setConnected(false)
        showError('Disconnected from host.')
      })

      // Handle peer disconnection from signaling server
      peer.on('disconnected', () => {
        console.log('[Peer] Client disconnected from signaling server')
        if (!peer.destroyed) {
          peer.reconnect()
        }
      })

      peer.on('error', (err) => {
        console.error('[Peer] Client peer error:', err)
        if (err.type === 'peer-unavailable') {
          showError('Room not found. Check the room code and try again.')
        } else {
          showError('Connection error.')
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room.'
      showError(message)
    }
  }, [clientHandleMessage, showError])

  // ── Action: rejoinRoom (reconnect to existing game) ───────────────────

  const rejoinRoom = useCallback(async (code: string, name: string) => {
    try {
      playerName.current = name
      isHostRef.current = false
      roomCodeRef.current = code

      const { peer, connection } = await createClientPeer(code)
      peerRef.current = peer
      hostConnectionRef.current = connection

      setConnected(true)
      setIsHost(false)
      setSessionToken(peer.id)

      // Send rejoin message to host (small delay to ensure host has data listener ready)
      setTimeout(() => {
        const rejoinMsg: ClientMessage = { type: 'rejoin', name }
        connection.send(rejoinMsg)
      }, 200)

      // Listen for messages from host
      connection.on('data', (data) => {
        clientHandleMessage(data as HostMessage)
      })

      connection.on('close', () => {
        console.log('[Peer] Connection to host closed')
        setConnected(false)
        showError('Disconnected from host.')
      })

      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect()
      })

      peer.on('error', (err) => {
        console.error('[Peer] Rejoin peer error:', err)
        if (err.type === 'peer-unavailable') {
          showError('Room no longer exists.')
        } else {
          showError('Connection error.')
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rejoin.'
      showError(message)
    }
  }, [clientHandleMessage, showError])

  // ── Action: leaveRoom ─────────────────────────────────────────────────

  const leaveRoom = useCallback(() => {
    // If client, notify host
    if (!isHostRef.current && hostConnectionRef.current?.open) {
      const msg: ClientMessage = { type: 'leave' }
      hostConnectionRef.current.send(msg)
    }

    // If host, notify all peers that the room is closing
    if (isHostRef.current) {
      broadcast({ type: 'error', message: 'Host has left the room.' })
      // Close all connections
      for (const conn of connectionsRef.current) {
        conn.close()
      }
    }

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    // Reset all state
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
    setConnected(false)

    playerName.current = null
    playerIcon.current = null
    roomCodeRef.current = null
    isHostRef.current = false
    roomPlayersRef.current = []
    gameStateRef.current = null
    roomStatusRef.current = 'lobby'
    connectionsRef.current = []
    hostConnectionRef.current = null

    clearSession()
  }, [broadcast])


  // ── Action: startGame (host only) ─────────────────────────────────────

  const startGame = useCallback(() => {
    if (!isHostRef.current) return
    if (roomStatusRef.current !== 'lobby') return

    const rps = roomPlayersRef.current
    if (rps.length < 2) {
      showError('At least 2 players are required to start a game.')
      return
    }

    const playerCount = rps.length

    // Create game via GameEngine
    const gs = GameEngine.createGame(playerCount, 0)

    // Seat assignment with random tier ordering (same logic as server GameController)
    const tierForSeat = (seat: number): number => {
      if (seat === 0) return 0
      if (seat <= 2) return 1
      return 2
    }

    const seats = Array.from({ length: playerCount }, (_, i) => i)
    for (let i = seats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seats[i], seats[j]] = [seats[j]!, seats[i]!]
    }

    const playerAssignments = rps.map((rp, i) => ({
      roomPlayer: rp,
      assignedSeat: seats[i]!,
      tier: tierForSeat(seats[i]!),
    }))

    playerAssignments.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return Math.random() - 0.5
    })

    // Reorder room players to match sorted turn order
    roomPlayersRef.current = playerAssignments.map((pa, i) => {
      pa.roomPlayer.playerIndex = i
      return pa.roomPlayer
    })

    // Patch game state players with names, AI status, and correct spices
    for (let i = 0; i < playerCount; i++) {
      const assignment = playerAssignments[i]!
      const enginePlayer = gs.players[i]!
      enginePlayer.name = assignment.roomPlayer.name

      const seatSpices = getStartingSpices(assignment.assignedSeat, playerCount)
      enginePlayer.caravan = seatSpices

      if (assignment.roomPlayer.isAI) {
        enginePlayer.isAI = true
        enginePlayer.aiDifficulty = assignment.roomPlayer.aiDifficulty
      }
    }

    gameStateRef.current = gs
    roomStatusRef.current = 'playing'

    // Clear any lingering errors
    setError(null)

    // Broadcast state to all peers
    const stateMsg: HostMessage = { type: 'state-update', gameState: sanitizeForSend(gs) }
    broadcast(stateMsg)

    // Update local state
    setGameState(gs)
    setLastAction(null)
    setLastActionPlayerIndex(null)
  }, [broadcast, showError])

  // ── Action: sendAction ────────────────────────────────────────────────

  const sendAction = useCallback((action: GameAction) => {
    if (isHostRef.current) {
      // Host processes locally
      const result = hostProcessAction(action, 'host')
      if ('error' in result) {
        showError(result.error!)
      } else {
        const stateMsg: HostMessage = {
          type: 'state-update',
          gameState: sanitizeForSend(result.gameState!),
          action,
          playerIndex: result.actingPlayerIndex,
        }
        broadcast(stateMsg)
        setGameState(result.gameState!)
        setLastAction(action)
        setLastActionPlayerIndex(result.actingPlayerIndex!)
      }
    } else {
      // Client sends to host
      if (hostConnectionRef.current?.open) {
        const msg: ClientMessage = { type: 'action', action }
        hostConnectionRef.current.send(msg)
      }
    }
  }, [hostProcessAction, broadcast, showError])

  // ── Action: sendDiscard ───────────────────────────────────────────────

  const sendDiscard = useCallback((toDiscard: { yellow: number; red: number; green: number; brown: number }) => {
    if (isHostRef.current) {
      const result = hostProcessDiscard(toDiscard, 'host')
      if ('error' in result) {
        showError(result.error!)
      } else {
        const stateMsg: HostMessage = { type: 'state-update', gameState: sanitizeForSend(result.gameState!) }
        broadcast(stateMsg)
        setGameState({ ...result.gameState! })
        setLastAction(null)
        setLastActionPlayerIndex(null)
      }
    } else {
      if (hostConnectionRef.current?.open) {
        const msg: ClientMessage = { type: 'discard', toDiscard }
        hostConnectionRef.current.send(msg)
      }
    }
  }, [hostProcessDiscard, broadcast, showError])

  // ── Action: attemptReconnect ──────────────────────────────────────────

  const attemptReconnect = useCallback((): boolean => {
    const saved = loadSession()
    if (!saved.sessionToken || !saved.roomCode) return false

    // Restore player name
    if (saved.playerName) playerName.current = saved.playerName
    if (saved.icon) playerIcon.current = saved.icon

    if (saved.isHost) {
      // Re-create as host
      createRoom(saved.playerName ?? 'Player', saved.icon ?? '👤')
    } else {
      // Re-join as client
      joinRoom(saved.roomCode, saved.playerName ?? 'Player', saved.icon ?? '👤')
    }

    return true
  }, [createRoom, joinRoom])

  // ── Action: restartGame (host only) ───────────────────────────────────

  const restartGame = useCallback(() => {
    if (!isHostRef.current) return

    gameStateRef.current = null
    roomStatusRef.current = 'lobby'

    const lobbyPlayers = toLobbyPlayers(roomPlayersRef.current)

    // Broadcast restart to all peers
    broadcast({ type: 'restarted', players: lobbyPlayers })

    // Update local state
    setGameState(null)
    setMyPlayerIndex(null)
    setIsMyTurn(false)
    setLastAction(null)
    setLastActionPlayerIndex(null)
    setDisconnectedPlayers([])
    setPlayers(lobbyPlayers)
  }, [toLobbyPlayers, broadcast])


  // ── Action: addAI (host only) ─────────────────────────────────────────

  const addAI = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    if (!isHostRef.current) return
    if (roomStatusRef.current !== 'lobby') return
    if (roomPlayersRef.current.length >= MAX_PLAYERS) {
      showError('Room is full.')
      return
    }

    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)

    const aiPlayer: RoomPlayer = {
      clientId: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `AI (${difficultyLabel})`,
      icon: '🤖',
      playerIndex: roomPlayersRef.current.length,
      isAI: true,
      aiDifficulty: difficulty,
    }

    roomPlayersRef.current = [...roomPlayersRef.current, aiPlayer]
    broadcastPlayers('player-joined')
  }, [broadcastPlayers, showError])

  // ── Action: removeAI (host only) ──────────────────────────────────────

  const removeAI = useCallback((playerIndex: number) => {
    if (!isHostRef.current) return
    if (roomStatusRef.current !== 'lobby') return

    const player = roomPlayersRef.current[playerIndex]
    if (!player?.isAI) return

    roomPlayersRef.current = roomPlayersRef.current.filter((_, i) => i !== playerIndex)
    roomPlayersRef.current.forEach((rp, i) => { rp.playerIndex = i })

    broadcastPlayers('player-left', player.name)
  }, [broadcastPlayers])

  // ── Action: renameAI (host only) ──────────────────────────────────────

  const renameAI = useCallback((playerIndex: number, newName: string) => {
    if (!isHostRef.current) return
    if (roomStatusRef.current !== 'lobby') return

    const player = roomPlayersRef.current[playerIndex]
    if (!player?.isAI) return

    const trimmed = newName.trim()
    if (trimmed.length === 0 || trimmed.length > 20) return

    player.name = trimmed
    broadcastPlayers('player-joined')
  }, [broadcastPlayers])

  // ── Context value ─────────────────────────────────────────────────────

  const value: MultiplayerContextValue = {
    socket: null,
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
    rejoinRoom,
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
