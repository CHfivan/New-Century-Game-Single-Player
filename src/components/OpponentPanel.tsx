/**
 * OpponentPanel component
 * Displays opponent information in collapsible right panel
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Player } from '../types'
import { CaravanGrid } from './CaravanGrid'
import { assetUrl } from '../utils/assetUrl'
import './OpponentPanel.css'

interface OpponentCardProps {
  opponent: Player
  isCurrent: boolean
  onPlayedCardsClick?: (playerId: string) => void
}

/** Individual opponent card — memoized to avoid re-renders when other game state changes */
const OpponentCard: React.FC<OpponentCardProps> = React.memo(({ opponent, isCurrent, onPlayedCardsClick }) => {
  return (
    <div
      className={`opponent-card ${isCurrent ? 'current' : ''}`}
    >
      {/* Player Name */}
      <div className="opponent-name">{opponent.name}</div>

      {/* Caravan Grid */}
      <CaravanGrid caravan={opponent.caravan} />

      {/* Score */}
      <div className="opponent-score">
        Score: {opponent.score} points
      </div>

      {/* Coins */}
      <div className="opponent-coins">
        <div className="coin-display">
          <span>🪙</span>
          <span>{opponent.coins.gold} gold</span>
        </div>
        <div className="coin-display">
          <span>🪙</span>
          <span>{opponent.coins.silver} silver</span>
        </div>
      </div>

      {/* Card Counts */}
      <div className="opponent-cards">
        <div className="card-count" title={`${opponent.hand.length} cards in hand`} aria-label={`${opponent.hand.length} cards in hand`}>
          <span aria-hidden="true">🃏</span>
          <span>{opponent.hand.length}</span>
        </div>
        <div
          className="card-count played-cards"
          onClick={() => onPlayedCardsClick?.(opponent.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlayedCardsClick?.(opponent.id) } }}
          title="View played cards"
          role="button"
          tabIndex={0}
          aria-label={`View ${opponent.name}'s ${opponent.playedCards.length} played cards`}
        >
          <span>📋</span>
          <span>{opponent.playedCards.length}</span>
        </div>
        <div className="card-count" title={`${opponent.pointCards.length} point cards`} aria-label={`${opponent.pointCards.length} point cards`}>
          <span aria-hidden="true">⭐</span>
          <span>{opponent.pointCards.length}</span>
        </div>
      </div>
    </div>
  )
})

interface OpponentPanelProps {
  opponents: Player[]
  currentPlayerId: string
  onPlayedCardsClick?: (playerId: string) => void
  onWidthChange?: (width: number) => void
}

// Helper function to get panel width based on screen size
const getPanelWidth = (): number => {
  const width = window.innerWidth
  
  if (width <= 900) return 125 // Mobile (halved from 250)
  if (width <= 1024) return 140 // Tablet (halved from 280)
  return 300 // Desktop
}

export const OpponentPanel: React.FC<OpponentPanelProps> = ({
  opponents,
  currentPlayerId,
  onPlayedCardsClick,
  onWidthChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  // Notify parent of width changes
  useEffect(() => {
    const updateWidth = () => {
      const width = isExpanded ? getPanelWidth() : 0
      onWidthChange?.(width)
    }
    
    updateWidth()
    
    // Update on window resize
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isExpanded, onWidthChange])

  const handlePlayedCardsClick = useCallback((playerId: string) => {
    if (onPlayedCardsClick) {
      onPlayedCardsClick(playerId)
    }
  }, [onPlayedCardsClick])

  const panelWidth = getPanelWidth()
  const buttonRight = isExpanded ? panelWidth : 0
  
  return (
    <>
      {/* Toggle Button - fixed position, separate from panel */}
      <button
        className="panel-toggle"
        onClick={handleToggle}
        aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        style={{ right: `${buttonRight}px` }}
      >
        <img src={assetUrl('/assets/image/players.png')} alt="" className="toggle-icon" />
        {isExpanded ? '▶' : '◀'}
      </button>

      {/* Panel */}
      <div 
        className={`opponent-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{ width: isExpanded ? `${panelWidth}px` : '0' }}
        role="complementary"
        aria-label="Opponent information panel"
      >

      {/* Panel Content */}
      <div className={`panel-content ${isExpanded ? '' : 'collapsed'}`}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Opponents</h2>
        <div className="opponent-list">
          {opponents.map((opponent) => (
            <OpponentCard
              key={opponent.id}
              opponent={opponent}
              isCurrent={opponent.id === currentPlayerId}
              onPlayedCardsClick={handlePlayedCardsClick}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
