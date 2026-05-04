/**
 * Server entry point — Express + Socket.IO bootstrap.
 * Env shim must be imported first so shared src/ code can use import.meta.env.
 */

// Shim import.meta.env for Vite-dependent shared code
import './env-shim.js'

import express from 'express'
import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { loadConfig } from './config.js'

import { RoomManager } from './RoomManager.js'
import { GameController } from './GameController.js'
import { SocketHandler } from './SocketHandler.js'

const config = loadConfig()

const app = express()

// Determine CORS origin — use true (allow any) for wildcard, otherwise use the list
const corsOrigin = config.ALLOWED_ORIGINS.includes('*') ? true : config.ALLOWED_ORIGINS

// CORS middleware for HTTP requests
app.use(
  cors({
    origin: corsOrigin,
  })
)

app.use(express.json())

// Health-check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const httpServer = createServer(app)

// Attach Socket.IO with CORS configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
})

// Instantiate server-side components
const roomManager = new RoomManager(config)
const gameController = new GameController(config)

// SocketHandler registers its own io.on('connection', ...) listener
const socketHandler = new SocketHandler(io, roomManager, gameController)

httpServer.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${config.PORT}`)
  console.log(`CORS origin: ${corsOrigin === true ? '* (any)' : config.ALLOWED_ORIGINS.join(', ')}`)
  console.log(`[VERSION] Server code updated: AI delay = 15s initial, 3s between turns`)
})

// Periodically clean up rooms with no connected players
setInterval(() => {
  roomManager.cleanupStaleRooms()
}, config.ROOM_CLEANUP_INTERVAL_MS)

export { app, io, httpServer, config, roomManager, gameController, socketHandler }
