/**
 * TurnIndicator component
 * Shows current player name, turn number, and turn status
 */

import React from 'react'
import './TurnIndicator.css'

interface TurnIndicatorProps {
  playerName: string
  turnNumber: number
  isHumanTurn: boolean
  isAIThinking?: boolean
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  playerName,
  turnNumber,
  isHumanTurn,
  isAIThinking = false,
}) => {
  const getMessage = () => {
    if (isAIThinking) {
      return '🤖 AI Thinking...'
    }
    if (isHumanTurn) {
      return '👤 Your Turn'
    }
    return '⏳ Waiting...'
  }

  return (
    <div className="turn-indicator" role="status" aria-live="polite" aria-label={`Turn ${turnNumber}, ${playerName}: ${getMessage()}`}>
      <div className="turn-info">
        <span className="turn-number">Turn {turnNumber}</span>
        <span className="turn-separator" aria-hidden="true">•</span>
        <span className="current-player">{playerName}</span>
      </div>
      <div className={`turn-status ${isHumanTurn ? 'human' : 'ai'}`}>
        {getMessage()}
      </div>
    </div>
  )
}
