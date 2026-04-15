/**
 * PlayedCardsOverlay component
 * Displays played merchant cards as actual card images in a grid
 * Max 4 columns, scrollable after 3 rows (12 cards)
 */

import React from 'react'
import { MerchantCard } from '../types'
import { CardEffectDisplay } from './CardEffectDisplay'
import './PlayedCardsOverlay.css'

interface PlayedCardsOverlayProps {
  playerName: string
  cards: MerchantCard[]
  onClose: () => void
  isMobile?: boolean
}

export const PlayedCardsOverlay: React.FC<PlayedCardsOverlayProps> = ({
  playerName,
  cards,
  onClose,
}) => {
  return (
    <div className="played-cards-overlay" onClick={onClose}>
      <div className="played-cards-window" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h2 className="overlay-title">{playerName}'s Played Cards</h2>
          <button className="overlay-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {cards.length > 0 ? (
          <div className="played-cards-grid">
            {cards.map((card, index) => (
              <div key={`${card.id}-${index}`} className="played-card-item">
                <div className="played-card-image">
                  <img src={card.imageUrl} alt={card.id} />
                </div>
                <div className="played-card-effect">
                  <CardEffectDisplay card={card} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-message">No cards played yet</div>
        )}
      </div>
    </div>
  )
}
