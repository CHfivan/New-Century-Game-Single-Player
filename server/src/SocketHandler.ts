/**
 * SocketHandler — wires Socket.IO events to RoomManager and GameController.
 */

import type { Server, Socket } from 'socket.io'
import type { RoomManager, Room } from './RoomManager.js'
import type { GameController } from './GameController.js'

interface LobbyPlayer {
  name: string
  icon: string
  isHost: boolean
  connected: boolean
  isAI?: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

export class SocketHandler {
  private io: Server
  private roomManager: RoomManager
  private gameController: GameController

  constructor(io: Server, roomManager: RoomManager, gameController: GameController) {
    this.io = io
    this.roomManager = roomManager
    this.gameController = gameController

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)
      this.registerEvents(socket)
    })
  }

  /**
   * Convert a Room's players array to the LobbyPlayer wire format.
   */
  private toLobbyPlayers(room: Room): LobbyPlayer[] {
    return room.players.map((p) => ({
      name: p.name,
      icon: p.icon,
      isHost: p.sessionToken === room.hostSessionToken,
      connected: p.isAI ? true : p.socketId !== null,
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty,
    }))
  }

  /**
   * Register all Socket.IO event listeners for a single connection.
   */
  registerEvents(socket: Socket): void {
    // ── room:create ──────────────────────────────────────────────────────
    socket.on('room:create', (data: { playerName: string; icon: string }) => {
      try {
        const { roomCode, sessionToken } = this.roomManager.createRoom(
          data.playerName,
          data.icon
        )

        // Set the host's socketId on the RoomPlayer
        const room = this.roomManager.getRoom(roomCode)!
        const hostPlayer = room.players.find((p) => p.sessionToken === sessionToken)!
        hostPlayer.socketId = socket.id

        // Track room/session on this socket for disconnect handling
        socket.data.roomCode = roomCode
        socket.data.sessionToken = sessionToken

        // Join the Socket.IO room
        socket.join(roomCode)

        socket.emit('room:created', {
          roomCode,
          sessionToken,
          inviteLink: `${roomCode}`,
          players: this.toLobbyPlayers(room),
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create room.'
        socket.emit('game:error', { message })
      }
    })

    // ── room:join ─────────────────────────────────────────────────────────
    socket.on(
      'room:join',
      (data: { roomCode: string; playerName: string; icon: string }) => {
        try {
          const { sessionToken } = this.roomManager.joinRoom(
            data.roomCode,
            data.playerName,
            data.icon
          )

          // Set the new player's socketId
          const room = this.roomManager.getRoom(data.roomCode)!
          const player = room.players.find((p) => p.sessionToken === sessionToken)!
          player.socketId = socket.id

          // Track room/session on this socket
          socket.data.roomCode = data.roomCode
          socket.data.sessionToken = sessionToken

          // Join the Socket.IO room
          socket.join(data.roomCode)

          const lobbyPlayers = this.toLobbyPlayers(room)

          // Send confirmation to the joining player
          socket.emit('room:joined', {
            sessionToken,
            players: lobbyPlayers,
          })

          // Broadcast updated player list to everyone else in the room
          socket.to(data.roomCode).emit('room:player-joined', {
            players: lobbyPlayers,
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to join room.'
          socket.emit('game:error', { message })
        }
      }
    )

    // ── room:leave ────────────────────────────────────────────────────────
    socket.on('room:leave', () => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) return

        const room = this.roomManager.getRoom(roomCode)
        const leavingPlayer = room?.players.find(
          (p) => p.sessionToken === sessionToken
        )
        const leavingName = leavingPlayer?.name ?? 'Unknown'

        this.roomManager.leaveRoom(roomCode, sessionToken)

        socket.leave(roomCode)
        socket.data.roomCode = undefined
        socket.data.sessionToken = undefined

        // Broadcast to remaining players
        const updatedRoom = this.roomManager.getRoom(roomCode)
        if (updatedRoom) {
          this.io.to(roomCode).emit('room:player-left', {
            players: this.toLobbyPlayers(updatedRoom),
            leftPlayerName: leavingName,
          })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to leave room.'
        socket.emit('game:error', { message })
      }
    })

    // ── room:add-ai ─────────────────────────────────────────────────────
    socket.on('room:add-ai', (data: { difficulty: 'easy' | 'medium' | 'hard' }) => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Only the host can add AI players
        if (room.hostSessionToken !== sessionToken) {
          socket.emit('game:error', { message: 'Only the host can add AI players.' })
          return
        }

        this.roomManager.addAIPlayer(roomCode, data.difficulty)

        const lobbyPlayers = this.toLobbyPlayers(room)
        this.io.to(roomCode).emit('room:player-joined', { players: lobbyPlayers })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add AI player.'
        socket.emit('game:error', { message })
      }
    })

    // ── room:remove-ai ──────────────────────────────────────────────────
    socket.on('room:remove-ai', (data: { playerIndex: number }) => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Only the host can remove AI players
        if (room.hostSessionToken !== sessionToken) {
          socket.emit('game:error', { message: 'Only the host can remove AI players.' })
          return
        }

        this.roomManager.removeAIPlayer(roomCode, data.playerIndex)

        const lobbyPlayers = this.toLobbyPlayers(room)
        this.io.to(roomCode).emit('room:player-left', {
          players: lobbyPlayers,
          leftPlayerName: 'AI Player',
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove AI player.'
        socket.emit('game:error', { message })
      }
    })

    // ── room:rename-ai ─────────────────────────────────────────────────
    socket.on('room:rename-ai', (data: { playerIndex: number; newName: string }) => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Only the host can rename AI players
        if (room.hostSessionToken !== sessionToken) {
          socket.emit('game:error', { message: 'Only the host can rename AI players.' })
          return
        }

        this.roomManager.renameAIPlayer(roomCode, data.playerIndex, data.newName)

        const lobbyPlayers = this.toLobbyPlayers(room)
        this.io.to(roomCode).emit('room:player-joined', { players: lobbyPlayers })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to rename AI player.'
        socket.emit('game:error', { message })
      }
    })

    // ── game:start ────────────────────────────────────────────────────────
    socket.on('game:start', () => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Only the host can start the game
        if (room.hostSessionToken !== sessionToken) {
          socket.emit('game:error', { message: 'Only the host can start the game.' })
          return
        }

        const gameState = this.gameController.startGame(room)
        this.io.to(roomCode).emit('game:state-update', { gameState })

        // AI turns are now handled client-side by the host via useAITurn
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start game.'
        socket.emit('game:error', { message })
      }
    })

    // ── game:action ───────────────────────────────────────────────────────
    socket.on('game:action', (data: { action: unknown }) => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Look up the acting player's index before processing.
        // If the current player is AI, the host is acting on their behalf,
        // so use the current player index from the game state.
        const gameStateBefore = room.gameState as import('../../src/types/index.js').GameState | null
        const currentAIPlayer = gameStateBefore
          ? room.players[gameStateBefore.currentPlayerIndex]
          : null
        const isAIAction = currentAIPlayer?.isAI === true

        const roomPlayer = room.players.find((p) => p.sessionToken === sessionToken)
        const playerIndex = isAIAction
          ? gameStateBefore!.currentPlayerIndex
          : (roomPlayer?.playerIndex ?? undefined)

        // processAction validates turn order and action legality
        const gameState = this.gameController.processAction(
          room,
          sessionToken,
          data.action as import('../../src/types/index.js').GameAction
        )

        // Broadcast state along with the action and who performed it,
        // so remote clients can trigger animations.
        this.io.to(roomCode).emit('game:state-update', {
          gameState,
          action: data.action,
          playerIndex,
        })

        // AI turns are now handled client-side by the host via useAITurn
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid action.'
        socket.emit('game:error', { message })
      }
    })

    // ── game:discard — handle caravan overflow discard + end turn ────────
    socket.on('game:discard', (data: { toDiscard: { yellow: number; red: number; green: number; brown: number } }) => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room || !room.gameState) {
          socket.emit('game:error', { message: 'Room or game not found.' })
          return
        }

        const roomPlayer = room.players.find((p) => p.sessionToken === sessionToken)
        if (!roomPlayer) {
          socket.emit('game:error', { message: 'Player not found.' })
          return
        }

        const gameState = room.gameState as import('../../src/types/index.js').GameState
        const player = gameState.players[roomPlayer.playerIndex]
        if (!player) {
          socket.emit('game:error', { message: 'Player not found in game state.' })
          return
        }

        // Apply the discard to the player's caravan
        player.caravan = {
          yellow: player.caravan.yellow - (data.toDiscard.yellow || 0),
          red: player.caravan.red - (data.toDiscard.red || 0),
          green: player.caravan.green - (data.toDiscard.green || 0),
          brown: player.caravan.brown - (data.toDiscard.brown || 0),
        }

        // Advance turn
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length
        gameState.turnNumber++

        // Clear any snapshot
        gameState.stateSnapshot = null

        room.lastActivityAt = Date.now()

        // Broadcast updated state
        this.io.to(roomCode).emit('game:state-update', { gameState })

        // AI turns are now handled client-side by the host via useAITurn
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Discard failed.'
        socket.emit('game:error', { message })
      }
    })

    // ── game:restart — reset room back to lobby for another game ────────
    socket.on('game:restart', () => {
      try {
        const roomCode = socket.data.roomCode as string | undefined
        const sessionToken = socket.data.sessionToken as string | undefined
        if (!roomCode || !sessionToken) {
          socket.emit('game:error', { message: 'Not in a room.' })
          return
        }

        const room = this.roomManager.getRoom(roomCode)
        if (!room) {
          socket.emit('game:error', { message: 'Room not found.' })
          return
        }

        // Only the host can restart
        if (room.hostSessionToken !== sessionToken) {
          socket.emit('game:error', { message: 'Only the host can start another game.' })
          return
        }

        this.gameController.resetToLobby(room)

        // Broadcast lobby state to all players
        const lobbyPlayers = this.toLobbyPlayers(room)
        this.io.to(roomCode).emit('game:restarted', { players: lobbyPlayers })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to restart game.'
        socket.emit('game:error', { message })
      }
    })

    // ── disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)

      const roomCode = socket.data.roomCode as string | undefined
      const sessionToken = socket.data.sessionToken as string | undefined
      if (!roomCode || !sessionToken) return

      const room = this.roomManager.getRoom(roomCode)
      if (!room) return

      const player = room.players.find((p) => p.sessionToken === sessionToken)
      if (!player) return

      const playerName = player.name

      this.gameController.handleDisconnect(room, sessionToken)

      // If the disconnected player was the host, reassign to the first connected player
      if (room.hostSessionToken === sessionToken) {
        const newHost = room.players.find(p => p.socketId !== null && p.sessionToken !== sessionToken)
        if (newHost) {
          room.hostSessionToken = newHost.sessionToken
          // Notify all players about the new host
          this.io.to(roomCode).emit('room:host-changed', {
            newHostName: newHost.name,
            players: this.toLobbyPlayers(room),
          })
        }
      }

      // Broadcast disconnection to the room
      const disconnected = room.disconnectedPlayers.get(sessionToken)
      this.io.to(roomCode).emit('room:player-disconnected', {
        playerName,
        reconnectionDeadline: disconnected?.reconnectionDeadline ?? 0,
      })
    })

    // ── room:reconnect ────────────────────────────────────────────────────
    socket.on(
      'room:reconnect',
      (data: { roomCode: string; sessionToken: string }) => {
        try {
          const room = this.roomManager.reconnect(data.roomCode, data.sessionToken)
          if (!room) {
            socket.emit('game:error', {
              message: 'Reconnection failed. Room not found or session expired.',
            })
            return
          }

          // Restore the player's socketId
          const player = room.players.find(
            (p) => p.sessionToken === data.sessionToken
          )
          if (player) {
            player.socketId = socket.id
          }

          // Track room/session on this socket
          socket.data.roomCode = data.roomCode
          socket.data.sessionToken = data.sessionToken

          // Rejoin the Socket.IO room
          socket.join(data.roomCode)

          // Get current game state for the reconnecting player
          const gameState = this.gameController.handleReconnect(
            room,
            data.sessionToken
          )

          // Send state to the reconnected player
          socket.emit('game:state-update', { gameState })

          // Notify the room that the player reconnected
          const playerName = player?.name ?? 'Unknown'
          socket.to(data.roomCode).emit('room:player-reconnected', {
            playerName,
          })
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Reconnection failed.'
          socket.emit('game:error', { message })
        }
      }
    )
  }

}
