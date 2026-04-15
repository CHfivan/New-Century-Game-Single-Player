/**
 * ScoreDisplay component
 * Shows current scores for all players
 */

import React, { useState } from 'react'
import { Player } from '../types'
import './ScoreDisplay.css'

interface ScoreDisplayProps {
  players: Player[]
  currentPlayerId: string
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  players,
  currentPlayerId,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const handleToggle = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className={`score-display ${isVisible ? '' : 'collapsed'}`}>
      <button
        className="score-toggle"
        onClick={handleToggle}
        aria-label={isVisible ? 'Hide scores' : 'Show scores'}
      >
        {isVisible ? '✕' : '📊'}
      </button>
      
      {isVisible && (
        <>
          <h3 className="score-title">Scores</h3>
          <div className="score-list">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`score-item ${
                  player.id === currentPlayerId ? 'current' : ''
                }`}
              >
                <span className="score-rank">#{index + 1}</span>
                <span className="score-name">{player.name}</span>
                <span className="score-points">{player.score} pts</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
