/**
 * PlayerHand component
 * Displays player's cards at bottom of screen with toggle visibility
 * Slides from left to right, starting at caravan's right edge
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MerchantCard } from '../types'
import { CardEffectDisplay } from './CardEffectDisplay'
import { createPortal } from 'react-dom'
import './PlayerHand.css'

interface PlayerHandProps {
  cards: MerchantCard[]
  onCardClick?: (card: MerchantCard, index: number) => void
  disabled?: boolean
  selectedCardIndex?: number | null
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  disabled = false,
  selectedCardIndex = null,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [maxWidth, setMaxWidth] = useState<number>(0)
  const [caravanWidth, setCaravanWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const calculateDimensions = () => {
      const caravan = document.querySelector('.player-caravan-fixed')
      const scorePanel = document.querySelector('.player-score-panel')
      const toggleButton = document.querySelector('.hand-toggle')
      
      if (caravan && scorePanel) {
        const caravanRect = caravan.getBoundingClientRect()
        const scorePanelRect = scorePanel.getBoundingClientRect()
        const toggleWidth = toggleButton ? toggleButton.getBoundingClientRect().width : 28
        
        setCaravanWidth(caravanRect.width)
        
        // Container width = space between caravan and score panel, minus toggle width
        // This ensures toggle tab's right edge doesn't overlap the score panel
        const availableWidth = scorePanelRect.left - caravanRect.right - toggleWidth
        setMaxWidth(Math.max(availableWidth, 0))
      }
    }

    calculateDimensions()
    window.addEventListener('resize', calculateDimensions)
    
    // Recalculate after a short delay to ensure toggle button is rendered
    setTimeout(calculateDimensions, 100)
    
    return () => window.removeEventListener('resize', calculateDimensions)
  }, [])

  const handleToggle = () => {
    setIsVisible(!isVisible)
  }

  // Track selected card position for overlay
  useEffect(() => {
    if (selectedCardIndex === null) {
      setSelectedRect(null)
      cancelAnimationFrame(rafRef.current)
      return
    }
    const update = () => {
      if (selectedCardIndex !== null && cardRefs.current[selectedCardIndex]) {
        const rect = cardRefs.current[selectedCardIndex]!.getBoundingClientRect()
        setSelectedRect(prev => {
          if (!prev || Math.abs(prev.left - rect.left) > 0.5 || Math.abs(prev.top - rect.top) > 0.5) return rect
          return prev
        })
      }
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedCardIndex, cards])

  const handleCardClick = (card: MerchantCard, index: number) => {
    if (!disabled && onCardClick) {
      onCardClick(card, index)
    }
  }

  const handleCardKeyDown = (e: React.KeyboardEvent, card: MerchantCard, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick(card, index)
    }
  }

  // Memoize adaptive margin calculation — avoids recalculating per card on every render
  const cardMargins = useMemo(() => {
    const padding = window.innerWidth <= 900 ? 10 : 24
    const containerInner = maxWidth - padding
    const firstCardEl = cardRefs.current[0]
    const cardW = firstCardEl ? firstCardEl.offsetWidth : (window.innerWidth <= 900 ? 61 : 88)
    
    return cards.map((_, index) => {
      if (index === 0 || cards.length <= 1) return 0
      const idealStep = (containerInner - cardW) / (cards.length - 1)
      const gap = idealStep - cardW
      const maxGap = 12
      return Math.min(gap, maxGap)
    })
  }, [cards.length, maxWidth])

  return (
    <div 
      ref={containerRef}
      className={`player-hand-container ${!isVisible ? 'hidden' : ''}`}
      style={{ 
        width: maxWidth > 0 ? `${maxWidth}px` : 'auto',
        left: `${caravanWidth}px`, // Position at caravan's right edge
        '--caravan-width': `${caravanWidth}px` // Pass to CSS for hidden state
      } as React.CSSProperties}
    >
      {/* Hand Cards */}
      <div className="player-hand" role="list" aria-label="Your hand cards">
        {cards.map((card, index) => {
          const isHovered = hoveredCard === index
          const marginLeft = cardMargins[index] || 0
          return (
            <div
              key={`${card.id}-${index}`}
              ref={el => { cardRefs.current[index] = el }}
              className={`hand-card ${disabled ? 'disabled' : ''} ${isHovered ? 'hovered' : ''} ${selectedCardIndex === index ? 'selected' : ''}`}
              style={index > 0 ? { marginLeft: `${marginLeft}px` } : undefined}
              onClick={() => handleCardClick(card, index)}
              onKeyDown={(e) => handleCardKeyDown(e, card, index)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              role="listitem"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Merchant card ${index + 1} of ${cards.length}: ${card.id}`}
              title={`Card: ${card.id}`}
            >
              {/* Image occupies full card area */}
              <div className="card-image">
                <img src={card.imageUrl} alt={card.id} />
              </div>
              {/* Effect overlay: column of spice squares + arrow */}
              <div className="card-effect-overlay">
                <CardEffectDisplay card={card} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Toggle Button - positioned at right edge of container */}
      <button
        className="hand-toggle"
        onClick={handleToggle}
        aria-label={isVisible ? 'Hide hand' : 'Show hand'}
      >
        <img src="/assets/image/hand2.jpg" alt="" className="toggle-icon" />
        {isVisible ? 'Hide' : 'Show'}
      </button>

      {/* Fixed overlay for selected card — breaks out of all parent clipping */}
      {selectedCardIndex !== null && selectedRect && cards[selectedCardIndex] && createPortal(
        <div
          className="hand-card-overlay"
          style={{
            position: 'fixed',
            left: selectedRect.left - selectedRect.width * 0.075,
            top: selectedRect.top - selectedRect.height * 0.075 - 10,
            width: selectedRect.width * 1.15,
            height: selectedRect.height * 1.15,
            zIndex: 500,
            pointerEvents: 'none',
            borderRadius: '8px',
            border: '3px solid #FFD700',
            overflow: 'hidden',
            boxShadow: '0 0 20px 6px rgba(255, 215, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <img src={cards[selectedCardIndex].imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="card-effect-overlay">
            <CardEffectDisplay card={cards[selectedCardIndex]} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
