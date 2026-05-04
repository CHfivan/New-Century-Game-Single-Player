/**
 * PeerJS WebRTC client for peer-to-peer multiplayer.
 *
 * Replaces the Socket.IO socketClient.ts.
 * - Host creates a Peer whose ID encodes the room code.
 * - Joining players connect to the host's peer ID.
 * - All communication uses PeerJS DataConnection (JSON messages).
 */

import Peer, { DataConnection } from 'peerjs'

// ── Constants ────────────────────────────────────────────────────────────────

/** Prefix added to room codes to form the PeerJS peer ID. */
const PEER_ID_PREFIX = 'csr-'

const ROOM_CODE_LENGTH = 6
const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// ── Message types ────────────────────────────────────────────────────────────

/** Messages sent from a joining client to the host. */
export type ClientMessage =
  | { type: 'join'; name: string; icon: string }
  | { type: 'rejoin'; name: string }
  | { type: 'action'; action: unknown }
  | { type: 'discard'; toDiscard: { yellow: number; red: number; green: number; brown: number } }
  | { type: 'add-ai'; difficulty: string }
  | { type: 'remove-ai'; playerIndex: number }
  | { type: 'rename-ai'; playerIndex: number; newName: string }
  | { type: 'start-game' }
  | { type: 'restart' }
  | { type: 'leave' }

/** Messages sent from the host to joining clients. */
export type HostMessage =
  | { type: 'joined'; players: unknown[]; resolvedName?: string }
  | { type: 'rejoined'; gameState: unknown; players: unknown[] }
  | { type: 'player-joined'; players: unknown[] }
  | { type: 'player-left'; players: unknown[]; leftPlayerName: string }
  | { type: 'state-update'; gameState: unknown; action?: unknown; playerIndex?: number }
  | { type: 'restarted'; players: unknown[] }
  | { type: 'error'; message: string }
  | { type: 'host-changed'; newHostName: string; players: unknown[] }

// ── Room code helpers ────────────────────────────────────────────────────────

/** Generate a random 6-character uppercase alphanumeric room code. */
export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

/** Convert a room code to the PeerJS peer ID. */
export function roomCodeToPeerId(roomCode: string): string {
  return `${PEER_ID_PREFIX}${roomCode.toUpperCase()}`
}

/** Extract the room code from a PeerJS peer ID. */
export function peerIdToRoomCode(peerId: string): string {
  return peerId.replace(PEER_ID_PREFIX, '')
}

// ── Peer lifecycle helpers ───────────────────────────────────────────────────

/**
 * Create a PeerJS Peer instance for the HOST.
 * The peer ID is `csr-{ROOMCODE}`.
 *
 * @returns A promise that resolves with the Peer once it's open.
 */
export function createHostPeer(roomCode: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peerId = roomCodeToPeerId(roomCode)
    const peer = new Peer(peerId, { serialization: 'json' })

    const timeout = setTimeout(() => {
      peer.destroy()
      reject(new Error('Timed out connecting to signaling server.'))
    }, 15_000)

    peer.on('open', () => {
      clearTimeout(timeout)
      console.log(`[Peer] Host peer open: ${peer.id}`)
      resolve(peer)
    })

    peer.on('error', (err) => {
      clearTimeout(timeout)
      console.error('[Peer] Host peer error:', err)
      // If the ID is taken, the room code is already in use
      if (err.type === 'unavailable-id') {
        reject(new Error('Room code already in use. Please try again.'))
      } else {
        reject(err)
      }
    })
  })
}

/**
 * Create a PeerJS Peer instance for a JOINING player and connect to the host.
 *
 * @returns A promise that resolves with { peer, connection } once connected.
 */
export function createClientPeer(
  roomCode: string
): Promise<{ peer: Peer; connection: DataConnection }> {
  return new Promise((resolve, reject) => {
    const peer = new Peer(undefined as any, { serialization: 'json' }) // random ID, JSON serialization

    const timeout = setTimeout(() => {
      peer.destroy()
      reject(new Error('Timed out connecting to signaling server.'))
    }, 15_000)

    peer.on('open', () => {
      clearTimeout(timeout)
      console.log(`[Peer] Client peer open: ${peer.id}`)

      const hostPeerId = roomCodeToPeerId(roomCode)
      const conn = peer.connect(hostPeerId, { reliable: true })

      const connTimeout = setTimeout(() => {
        peer.destroy()
        reject(new Error('Could not connect to host. Room may not exist.'))
      }, 10_000)

      conn.on('open', () => {
        clearTimeout(connTimeout)
        console.log(`[Peer] Connected to host: ${hostPeerId}`)
        resolve({ peer, connection: conn })
      })

      conn.on('error', (err) => {
        clearTimeout(connTimeout)
        console.error('[Peer] Connection error:', err)
        peer.destroy()
        reject(new Error('Failed to connect to host.'))
      })
    })

    peer.on('error', (err) => {
      clearTimeout(timeout)
      console.error('[Peer] Client peer error:', err)
      reject(err)
    })
  })
}
