/**
 * NewGameDialog component
 * Allows selecting player count (2-5) and AI difficulty (Easy/Medium/Hard)
 * Requirements: 6.1
 */

import React, { useState, useRef, useEffect } from 'react'
import './NewGameDialog.css'

interface NewGameDialogProps {
  onConfirm: (playerCount: number, aiCount: number, aiDifficulty: 'easy' | 'medium' | 'hard') => void
  onCancel: () => void
}

const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const NewGameDialog: React.FC<NewGameDialogProps> = ({ onConfirm, onCancel }) => {
  const [totalPlayers, setTotalPlayers] = useState(3)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const dialogRef = useRef<HTMLDivElement>(null)

  const aiCount = totalPlayers - 1

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleStart = () => {
    onConfirm(totalPlayers, aiCount, difficulty)
  }

  return (
    <div className="new-game-overlay" onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        className="new-game-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="New game setup"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ngd-close" onClick={onCancel} aria-label="Close dialog">
          ✕
        </button>

        <h2>New Game</h2>

        <div className="ngd-section">
          <label id="player-count-label">Total Players</label>
          <div className="ngd-options" role="radiogroup" aria-labelledby="player-count-label">
            {[2, 3, 4, 5].map((count) => (
              <button
                key={count}
                className={`ngd-option ${totalPlayers === count ? 'selected' : ''}`}
                onClick={() => setTotalPlayers(count)}
                role="radio"
                aria-checked={totalPlayers === count}
                aria-label={`${count} players`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="ngd-section">
          <label id="difficulty-label">AI Difficulty</label>
          <div className="ngd-options" role="radiogroup" aria-labelledby="difficulty-label">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                className={`ngd-option ${difficulty === level ? 'selected' : ''}`}
                onClick={() => setDifficulty(level)}
                role="radio"
                aria-checked={difficulty === level}
                aria-label={`${DIFFICULTY_LABELS[level]} difficulty`}
              >
                {DIFFICULTY_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="ngd-preview">
          <p className="ngd-preview-title">Game Setup</p>
          <p className="ngd-preview-text">
            {totalPlayers} players: 1 Human + {aiCount} AI ({DIFFICULTY_LABELS[difficulty]})
          </p>
        </div>

        <div className="ngd-actions">
          <button className="ngd-btn ngd-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="ngd-btn ngd-btn-start" onClick={handleStart}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  )
}
