/**
 * ProfileSetup component
 * Displays a name input and icon picker for multiplayer profile setup.
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React, { useState } from 'react'
import './ProfileSetup.css'

const PREDEFINED_ICONS = ['🧙', '🧝', '🧛', '🧜', '🦊', '🐉', '🦅', '🎭']

const NAME_PATTERN = /^[a-zA-Z0-9 !?.,'-]*$/
const MAX_NAME_LENGTH = 20

interface ProfileSetupProps {
  defaultPlayerNumber?: number
  onSubmit: (name: string, icon: string) => void
  onBack: () => void
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  defaultPlayerNumber = 1,
  onSubmit,
  onBack,
}) => {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(value)) {
      setName(value)
      setError(null)
    }
  }

  const handleSubmit = () => {
    const trimmed = name.trim()

    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer`)
      return
    }

    if (trimmed && !NAME_PATTERN.test(trimmed)) {
      setError('Name can only contain letters, numbers, spaces, and common punctuation')
      return
    }

    const finalName = trimmed || `Player ${defaultPlayerNumber}`
    const finalIcon = selectedIcon || PREDEFINED_ICONS[0]

    onSubmit(finalName, finalIcon)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="profile-setup">
      <div className="profile-setup-content">
        <h2 className="profile-setup-title">Player Profile</h2>
        <p className="profile-setup-subtitle">Enter your display name</p>

        <div className="profile-setup-field">
          <label htmlFor="profile-name" className="profile-setup-label">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            className="profile-setup-input"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
            placeholder={`Player ${defaultPlayerNumber}`}
            maxLength={MAX_NAME_LENGTH}
            aria-describedby={error ? 'profile-name-error' : undefined}
          />
          {error && (
            <p id="profile-name-error" className="profile-setup-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="profile-setup-actions">
          <button
            className="profile-btn profile-btn-confirm"
            onClick={handleSubmit}
            aria-label="Confirm profile"
          >
            ✅ Confirm
          </button>
          <button
            className="profile-btn profile-btn-back"
            onClick={onBack}
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
