import { io, Socket } from 'socket.io-client'

// In development, derive the server URL from the current page hostname
// so it works from any device on the network (not just localhost).
// In production, use the VITE_SERVER_URL env variable.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`

let socket: Socket | null = null

/**
 * Returns a singleton Socket.IO client instance.
 * Creates and connects on first call; subsequent calls return the same instance.
 */
export function getSocket(): Socket {
  if (socket) return socket

  socket = io(SERVER_URL, {
    autoConnect: false,
  })

  socket.on('connect', () => {
    console.log(`[Socket] Connected: ${socket!.id}`)
  })

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`)
  })

  socket.on('connect_error', (err) => {
    console.log(`[Socket] Connection error: ${err.message}`)
  })

  socket.connect()

  return socket
}

/**
 * Disconnects and disposes the singleton socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
