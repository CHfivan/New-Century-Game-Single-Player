/**
 * Server configuration loaded from environment variables with sensible defaults.
 */

export interface ServerConfig {
  PORT: number
  ALLOWED_ORIGINS: string[]
  RECONNECTION_WINDOW_MS: number
  MAX_ROOMS: number
  ROOM_CLEANUP_INTERVAL_MS: number
  STALE_ROOM_TIMEOUT_MS: number
}

export function loadConfig(): ServerConfig {
  return {
    PORT: parseInt(process.env.PORT || '3001', 10),
    // In development (no env var), allow any origin for LAN testing
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : ['*'],
    RECONNECTION_WINDOW_MS: parseInt(
      process.env.RECONNECTION_WINDOW_MS || '120000',
      10
    ),
    MAX_ROOMS: parseInt(process.env.MAX_ROOMS || '50', 10),
    ROOM_CLEANUP_INTERVAL_MS: parseInt(
      process.env.ROOM_CLEANUP_INTERVAL_MS || '60000',
      10
    ),
    STALE_ROOM_TIMEOUT_MS: parseInt(
      process.env.STALE_ROOM_TIMEOUT_MS || '600000',
      10
    ),
  }
}
