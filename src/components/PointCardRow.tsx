/**
 * PointCardRow component
 * Displays available point cards for claiming
 */

import React, { useRef, useEffect, useState } from 'react'
import { PointCard } from '../types'
import { assetUrl } from '../utils/assetUrl'
import { createPortal } from 'react-dom'
import './PointCardRow.css'

interface PointCardRowProps {
  cards: PointCard[]
  goldCoins: number
  silverCoins: number
  goldOnFirst?: boolean
  onCardClick?: (card: PointCard, index: number) => void
  disabled?: boolean
  selectedIndex?: number | null
}

/** Renders a single coin image with a count label */
const CoinStack: React.FC<{ count: number; type: 'gold' | 'silver' }> = React.memo(({ count, type }) => {
  if (count <= 0) return null
  const src = type === 'gold' ? assetUrl('/assets/image/gold_coin.png') : assetUrl('/assets/image/silver_coin.png')
  const alt = type === 'gold' ? 'Gold Coin' : 'Silver Coin'
  return (
    <div className="coin-stack">
      <img src={src} alt={alt} className="bonus-coin-img" />
      <span className="coin-count-badge">×{count}</span>
    </div>
  )
})

export const PointCardRow: React.FC<PointCardRowProps> = ({
  cards,
  goldCoins,
  silverCoins,
  goldOnFirst = true,
  onCardClick,
  disabled = false,
  selectedIndex = null,
}) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (selectedIndex === null) {
      setSelectedRect(null)
      cancelAnimationFrame(rafRef.current)
      return
    }

    const updatePosition = () => {
      if (selectedIndex !== null && cardRefs.current[selectedIndex]) {
        const rect = cardRefs.current[selectedIndex]!.getBoundingClientRect()
        setSelectedRect(prev => {
          if (!prev || Math.abs(prev.left - rect.left) > 0.5 || Math.abs(prev.top - rect.top) > 0.5) {
            return rect
          }
          return prev
        })
      }
      rafRef.current = requestAnimationFrame(updatePosition)
    }
    rafRef.current = requestAnimationFrame(updatePosition)

    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedIndex, cards])

  // Determine which coins go above which card position
  const pos0Coins = goldOnFirst
    ? { type: 'gold' as const, count: goldCoins }
    : { type: 'silver' as const, count: silverCoins }
  const pos1Coins = goldOnFirst
    ? { type: 'silver' as const, count: silverCoins }
    : null

  const selectedCard = selectedIndex !== null ? cards[selectedIndex] : null

  return (
    <div className="point-card-row" role="region" aria-label="Point cards available for claiming">
      <div className="card-row-container" role="list">
        {cards.map((card, index) => (
          <div key={`${card.id}-${index}`} className="card-wrapper">
            {/* Coin stacks above first 2 cards */}
            {index === 0 && pos0Coins.count > 0 && (
              <div className="coin-bonus-top">
                <CoinStack type={pos0Coins.type} count={pos0Coins.count} />
              </div>
            )}
            {index === 1 && pos1Coins && pos1Coins.count > 0 && (
              <div className="coin-bonus-top">
                <CoinStack type={pos1Coins.type} count={pos1Coins.count} />
              </div>
            )}
            {(index !== 0 && index !== 1) && (
              <div className="coin-bonus-top" />
            )}
            
            <div
              ref={el => { cardRefs.current[index] = el }}
              className={`point-card ${disabled ? 'disabled' : ''} ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => !disabled && onCardClick?.(card, index)}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onCardClick?.(card, index) } }}
              role="listitem"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Point card ${index + 1}: ${card.points} victory points`}
              title={`Point card: ${card.points} VP`}
            >
              <div className="card-image">
                <img src={card.imageUrl} alt={card.id} />
              </div>
              <div className="card-points-badge">{card.points}</div>
              <div className="card-cost-bar">
                {Array.from({ length: card.requiredSpices.yellow }).map((_, i) => (
                  <span key={`y${i}`} className="cost-spice cost-yellow" />
                ))}
                {Array.from({ length: card.requiredSpices.red }).map((_, i) => (
                  <span key={`r${i}`} className="cost-spice cost-red" />
                ))}
                {Array.from({ length: card.requiredSpices.green }).map((_, i) => (
                  <span key={`g${i}`} className="cost-spice cost-green" />
                ))}
                {Array.from({ length: card.requiredSpices.brown }).map((_, i) => (
                  <span key={`b${i}`} className="cost-spice cost-brown" />
                ))}
              </div>
            </div>
          </div>
        ))}
        
        <div className="deck-card">
          <img src={assetUrl('/assets/image/VP_card.png')} alt="Victory Point Deck" />
        </div>
      </div>

      {/* Fixed overlay for selected card — breaks out of all parent clipping */}
      {selectedCard && selectedRect && createPortal(
        <div
          className="point-card-overlay"
          style={{
            position: 'fixed',
            left: selectedRect.left - selectedRect.width * 0.06,
            top: selectedRect.top - selectedRect.height * 0.06,
            width: selectedRect.width * 1.12,
            height: selectedRect.height * 1.12,
            zIndex: 500,
            pointerEvents: 'none',
            borderRadius: '8px',
            border: '3px solid #FFD700',
            overflow: 'hidden',
            boxShadow: '0 0 20px 6px rgba(255, 215, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="card-image" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <img src={selectedCard.imageUrl} alt={selectedCard.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="card-points-badge">{selectedCard.points}</div>
          <div className="card-cost-bar">
            {Array.from({ length: selectedCard.requiredSpices.yellow }).map((_, i) => (
              <span key={`oy${i}`} className="cost-spice cost-yellow" />
            ))}
            {Array.from({ length: selectedCard.requiredSpices.red }).map((_, i) => (
              <span key={`or${i}`} className="cost-spice cost-red" />
            ))}
            {Array.from({ length: selectedCard.requiredSpices.green }).map((_, i) => (
              <span key={`og${i}`} className="cost-spice cost-green" />
            ))}
            {Array.from({ length: selectedCard.requiredSpices.brown }).map((_, i) => (
              <span key={`ob${i}`} className="cost-spice cost-brown" />
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
