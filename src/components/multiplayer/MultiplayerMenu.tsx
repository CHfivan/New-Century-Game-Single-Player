/**
 * MultiplayerMenu component
 * Entry point for multiplayer: Create Room / Join Room flows with ProfileSetup integration.
 * Requirements: 1.1, 2.1, 9.3
 */

import React, { useState } from 'react'
import { ProfileSetup } from './ProfileSetup'
import './MultiplayerMenu.css'

type Screen = 'menu' | 'create-profile' | 'join-code' | 'join-profile'

interface MultiplayerMenuProps {
  onCreateRoom: (name: string, icon: string) => void
  onJoinRoom: (roomCode: string, name: string, icon: string) => void
  onBack: () => void
  error: string | null
  prefilledRoomCode?: string | null
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBack,
  error,
  prefilledRoomCode,
}) => {
  const [screen, setScreen] = useState<Screen>(prefilledRoomCode ? 'join-code' : 'menu')
  const [roomCode, setRoomCode] = useState(prefilledRoomCode ?? '')
  const [codeError, setCodeError] = useState<string | null>(null)

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(value)
    setCodeError(null)
  }

  const handleCodeSubmit = () => {
    const trimmed = roomCode.trim()
    if (trimmed.length !== 6) {
      setCodeError('Room code must be 6 characters')
      return
    }
    setCodeError(null)
    setScreen('join-profile')
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCodeSubmit()
    }
  }

  if (screen === 'create-profile') {
    return (
      <ProfileSetup
        onSubmit={(name, icon) => onCreateRoom(name, icon)}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'join-profile') {
    return (
      <ProfileSetup
        onSubmit={(name, icon) => onJoinRoom(roomCode, name, icon)}
        onBack={() => setScreen('join-code')}
      />
    )
  }

  if (screen === 'join-code') {
    return (
      <div className="multiplayer-menu">
        <div className="multiplayer-menu-content">
          <h2 className="multiplayer-menu-title">Join Room</h2>
          <p className="multiplayer-menu-subtitle">Enter the 6-character room code</p>

          {error && (
            <p className="multiplayer-menu-error" role="alert">{error}</p>
          )}

          <div className="multiplayer-menu-field">
            <label htmlFor="room-code" className="multiplayer-menu-label">
              Room Code
            </label>
            <input
              id="room-code"
              type="text"
              className="multiplayer-menu-input"
              value={roomCode}
              onChange={handleRoomCodeChange}
              onKeyDown={handleCodeKeyDown}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
              placeholder="ABCD12"
              maxLength={6}
              autoFocus
              aria-describedby={codeError ? 'room-code-error' : undefined}
            />
            {codeError && (
              <p id="room-code-error" className="multiplayer-menu-field-error" role="alert">
                {codeError}
              </p>
            )}
          </div>

          <div className="multiplayer-menu-buttons">
            <button
              className="mp-menu-btn mp-menu-btn-primary"
              onClick={handleCodeSubmit}
              aria-label="Next: set up profile"
            >
              Next →
            </button>
            <button
              className="mp-menu-btn mp-menu-btn-back"
              onClick={() => { setRoomCode(''); setCodeError(null); setScreen('menu') }}
              aria-label="Back to multiplayer menu"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default: 'menu' screen
  return (
    <div className="multiplayer-menu">
      <div className="multiplayer-menu-content">
        <h2 className="multiplayer-menu-title">Multiplayer</h2>
        <p className="multiplayer-menu-subtitle">Play with friends online</p>

        {error && (
          <p className="multiplayer-menu-error" role="alert">{error}</p>
        )}

        <div className="multiplayer-menu-buttons">
          <button
            className="mp-menu-btn mp-menu-btn-create"
            onClick={() => setScreen('create-profile')}
            aria-label="Create a new room"
          >
            🏠 Create Room
          </button>
          <button
            className="mp-menu-btn mp-menu-btn-join"
            onClick={() => setScreen('join-code')}
            aria-label="Join an existing room"
          >
            🚪 Join Room
          </button>
          <button
            className="mp-menu-btn mp-menu-btn-back"
            onClick={onBack}
            aria-label="Back to main menu"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
