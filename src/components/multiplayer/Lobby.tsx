/**
 * Lobby component
 * Displays connected players, room code, invite link, and game controls.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.7
 */

import React, { useState, useCallback } from 'react'
import type { LobbyPlayer } from '../../types/multiplayer'
import './Lobby.css'

interface LobbyProps {
  roomCode: string
  players: LobbyPlayer[]
  isHost: boolean
  onStartGame: () => void
  onLeave: () => void
  onAddAI?: (difficulty: 'easy' | 'medium' | 'hard') => void
  onRemoveAI?: (playerIndex: number) => void
  onRenameAI?: (playerIndex: number, newName: string) => void
  error: string | null
}

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  players,
  isHost,
  onStartGame,
  onLeave,
  onAddAI,
  onRemoveAI,
  onRenameAI,
  error,
}) => {
  const [copied, setCopied] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [inviteLink])

  const handleAddAI = useCallback(() => {
    onAddAI?.(aiDifficulty)
  }, [onAddAI, aiDifficulty])

  const handleStartEditName = useCallback((index: number, currentName: string) => {
    setEditingIndex(index)
    setEditName(currentName)
  }, [])

  const handleConfirmEditName = useCallback(() => {
    if (editingIndex !== null && editName.trim()) {
      onRenameAI?.(editingIndex, editName.trim())
    }
    setEditingIndex(null)
    setEditName('')
  }, [editingIndex, editName, onRenameAI])

  const handleCancelEditName = useCallback(() => {
    setEditingIndex(null)
    setEditName('')
  }, [])

  const canStart = players.length >= 2
  const canAddAI = players.length < 5

  return (
    <div className="lobby">
      <div className="lobby-content">
        <h2 className="lobby-title">Game Lobby</h2>

        {error && (
          <p className="lobby-error" role="alert">{error}</p>
        )}

        {/* Room Code */}
        <div className="lobby-room-code-section">
          <span className="lobby-room-code-label">Room Code</span>
          <span className="lobby-room-code" aria-label={`Room code: ${roomCode.split('').join(' ')}`}>
            {roomCode}
          </span>
        </div>

        {/* Invite Link */}
        <div className="lobby-invite-section">
          <span className="lobby-invite-label">Invite Link</span>
          <div className="lobby-invite-row">
            <span className="lobby-invite-link" title={inviteLink}>
              {inviteLink}
            </span>
            <button
              className="lobby-copy-btn"
              onClick={handleCopyLink}
              aria-label={copied ? 'Link copied' : 'Copy invite link'}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="lobby-players-section">
          <span className="lobby-players-label">
            Players ({players.length}/5)
          </span>
          <ul className="lobby-player-list" aria-label="Connected players">
            {players.map((player, index) => (
              <li key={player.isAI ? `ai-${index}` : player.name} className="lobby-player-item">
                <span
                  className={`lobby-player-status ${player.connected ? 'connected' : 'disconnected'}`}
                  aria-label={player.connected ? 'Connected' : 'Disconnected'}
                />
                {player.isAI && (
                  <span className="lobby-player-icon" aria-hidden="true">
                    🤖
                  </span>
                )}
                {isHost && player.isAI && editingIndex === index ? (
                  <input
                    className="lobby-player-name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleConfirmEditName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmEditName()
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                    maxLength={20}
                    autoFocus
                    aria-label="Edit AI player name"
                  />
                ) : (
                  <span
                    className={`lobby-player-name ${isHost && player.isAI ? 'lobby-player-name-editable' : ''}`}
                    onClick={() => {
                      if (isHost && player.isAI) handleStartEditName(index, player.name)
                    }}
                    title={isHost && player.isAI ? 'Click to rename' : undefined}
                  >
                    {player.name}
                  </span>
                )}
                {player.isHost && (
                  <span className="lobby-player-host-badge">Host</span>
                )}
                {player.isAI && player.aiDifficulty && (
                  <span className={`lobby-player-ai-badge lobby-ai-${player.aiDifficulty}`}>
                    {player.aiDifficulty}
                  </span>
                )}
                {player.isAI && isHost && onRemoveAI && (
                  <button
                    className="lobby-remove-ai-btn"
                    onClick={() => onRemoveAI(index)}
                    aria-label={`Remove ${player.name}`}
                    title="Remove AI player"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add AI Section — host only */}
        {isHost && canAddAI && onAddAI && (
          <div className="lobby-add-ai-section">
            <div className="lobby-add-ai-row">
              <select
                className="lobby-ai-difficulty-select"
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                aria-label="AI difficulty"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button
                className="lobby-btn lobby-btn-add-ai"
                onClick={handleAddAI}
                aria-label="Add AI player"
              >
                🤖 Add AI
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="lobby-actions">
          {isHost && (
            <button
              className="lobby-btn lobby-btn-start"
              onClick={onStartGame}
              disabled={!canStart}
              aria-label={canStart ? 'Start game' : 'Need at least 2 players to start'}
            >
              🎮 Start Game
            </button>
          )}
          <button
            className="lobby-btn lobby-btn-leave"
            onClick={onLeave}
            aria-label="Leave lobby"
          >
            ← Leave
          </button>
        </div>
      </div>
    </div>
  )
}
