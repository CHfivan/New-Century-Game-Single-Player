/**
 * MerchantCardRow component
 * Displays available merchant cards for acquisition
 */

import React, { useRef, useEffect, useState } from 'react'
import { MerchantCard, SpiceType, SpiceCollection } from '../types'
import { CardEffectDisplay } from './CardEffectDisplay'
import { assetUrl } from '../utils/assetUrl'
import { createPortal } from 'react-dom'
import './MerchantCardRow.css'

const PLACED_CUBE_COLORS: Record<SpiceType, string> = {
  yellow: '#DAA520',
  red: '#C0392B',
  green: '#27AE60',
  brown: '#7B4F2E',
}

interface MerchantCardRowProps {
  cards: MerchantCard[]
  onCardClick?: (card: MerchantCard, index: number) => void
  disabled?: boolean
  selectedIndex?: number | null
  paymentMode?: boolean
  placedCubes?: Map<number, { type: SpiceType }>
  cardSpices?: SpiceCollection[]
}

/** Build an array of spice dots from a SpiceCollection */
function spiceDotsFromCollection(spices: SpiceCollection): SpiceType[] {
  const dots: SpiceType[] = []
  for (let i = 0; i < spices.yellow; i++) dots.push('yellow')
  for (let i = 0; i < spices.red; i++) dots.push('red')
  for (let i = 0; i < spices.green; i++) dots.push('green')
  for (let i = 0; i < spices.brown; i++) dots.push('brown')
  return dots
}

export const MerchantCardRow: React.FC<MerchantCardRowProps> = ({
  cards,
  onCardClick,
  disabled = false,
  selectedIndex = null,
  paymentMode = false,
  placedCubes,
  cardSpices,
}) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null)
  const [dropTargetRects, setDropTargetRects] = useState<Map<number, DOMRect>>(new Map())
  const rafRef = useRef<number>(0)

  // Track selected card position
  useEffect(() => {
    if (selectedIndex === null && !paymentMode) {
      setSelectedRect(null)
      setDropTargetRects(new Map())
      cancelAnimationFrame(rafRef.current)
      return
    }

    const updatePosition = () => {
      // Update selected card rect
      if (selectedIndex !== null && cardRefs.current[selectedIndex]) {
        const rect = cardRefs.current[selectedIndex]!.getBoundingClientRect()
        setSelectedRect(prev => {
          if (!prev || Math.abs(prev.left - rect.left) > 0.5 || Math.abs(prev.top - rect.top) > 0.5) {
            return rect
          }
          return prev
        })
      }
      // Update drop-target card rects during payment mode
      if (paymentMode && selectedIndex !== null) {
        const newRects = new Map<number, DOMRect>()
        for (let i = 0; i < selectedIndex; i++) {
          if (!placedCubes?.has(i) && cardRefs.current[i]) {
            newRects.set(i, cardRefs.current[i]!.getBoundingClientRect())
          }
        }
        setDropTargetRects(newRects)
      } else {
        setDropTargetRects(new Map())
      }
      rafRef.current = requestAnimationFrame(updatePosition)
    }
    rafRef.current = requestAnimationFrame(updatePosition)

    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedIndex, cards, paymentMode, placedCubes])

  const selectedCard = selectedIndex !== null ? cards[selectedIndex] : null
  const selectedSpices = selectedIndex !== null ? cardSpices?.[selectedIndex] : null
  const selectedDots = selectedSpices ? spiceDotsFromCollection(selectedSpices) : []
  const selectedPlacedType = selectedIndex !== null ? placedCubes?.get(selectedIndex)?.type : null

  return (
    <div className="merchant-card-row" role="region" aria-label="Merchant cards available for acquisition">
      <div className="card-row-container" role="list">
        {cards.map((card, index) => {
          const isDropTarget = paymentMode && selectedIndex !== null && index < selectedIndex && !placedCubes?.has(index)
          const hasPlacedCube = placedCubes?.has(index) ?? false
          const placedType = placedCubes?.get(index)?.type
          const persistentSpices = cardSpices?.[index]
          const persistentDots = persistentSpices ? spiceDotsFromCollection(persistentSpices) : []
          return (
            <div
              key={`${card.id}-${index}`}
              ref={el => { cardRefs.current[index] = el }}
              className={`merchant-card ${disabled ? 'disabled' : ''} ${selectedIndex === index ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''} ${hasPlacedCube ? 'has-placed-cube' : ''}`}
              onClick={() => !disabled && onCardClick?.(card, index)}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onCardClick?.(card, index) } }}
              role="listitem"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Merchant card ${index + 1} of ${cards.length}: ${card.id}${index > 0 ? `, costs ${index} spice${index !== 1 ? 's' : ''} to acquire` : ', free to acquire'}`}
              title={`Merchant card: ${card.id}${index > 0 ? ` (cost: ${index} spice${index !== 1 ? 's' : ''})` : ' (free)'}`}
            >
              <div className="card-image">
                <img src={card.imageUrl} alt={card.id} />
              </div>
              <div className="card-effect-overlay">
                <CardEffectDisplay card={card} />
              </div>
              {(persistentDots.length > 0 || hasPlacedCube) && (
                <div className="persistent-spices">
                  {persistentDots.map((type, i) => (
                    <div key={`persistent-${i}`} className="persistent-spice-dot" style={{ backgroundColor: PLACED_CUBE_COLORS[type] }} />
                  ))}
                  {hasPlacedCube && placedType && (
                    <div className="persistent-spice-dot placed-preview" style={{ backgroundColor: PLACED_CUBE_COLORS[placedType] }} />
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div className="deck-card">
          <img src={assetUrl('/assets/image/Merchant_card.webp')} alt="Merchant Card Deck" />
        </div>
      </div>

      {/* Portal overlays for drop-target cards — flashing yellow border */}
      {Array.from(dropTargetRects.entries()).map(([idx, rect]) => {
        const card = cards[idx]
        if (!card) return null
        const persistentSpices = cardSpices?.[idx]
        const dots = persistentSpices ? spiceDotsFromCollection(persistentSpices) : []
        return createPortal(
          <div
            key={`drop-overlay-${idx}`}
            className="merchant-drop-overlay merchant-card"
            style={{
              position: 'fixed',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              zIndex: 450,
              cursor: 'pointer',
              borderRadius: '8px',
              border: '3px solid #FFD700',
              overflow: 'hidden',
              animation: 'drop-overlay-flash 1s ease-in-out infinite',
            }}
            onClick={(e) => { e.stopPropagation(); onCardClick?.(card, idx) }}
          >
            <div className="card-image" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <img src={card.imageUrl} alt={card.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="card-effect-overlay">
              <CardEffectDisplay card={card} />
            </div>
            {dots.length > 0 && (
              <div className="persistent-spices">
                {dots.map((type, i) => (
                  <div key={`drop-dot-${i}`} className="persistent-spice-dot" style={{ backgroundColor: PLACED_CUBE_COLORS[type] }} />
                ))}
              </div>
            )}
          </div>,
          document.body
        )
      })}

      {/* Fixed overlay for selected card — breaks out of all parent clipping */}
      {selectedCard && selectedRect && createPortal(
        <div
          className="merchant-card-overlay"
          style={{
            position: 'fixed',
            left: selectedRect.left - selectedRect.width * 0.06,
            top: selectedRect.top - selectedRect.height * 0.06,
            width: selectedRect.width * 1.12,
            height: selectedRect.height * 1.12,
            zIndex: 500,
            pointerEvents: 'none',
            borderRadius: '8px',
            border: '3px solid #00E676',
            overflow: 'hidden',
            boxShadow: '0 0 10px 2px rgba(0, 230, 118, 0.3)',
          }}
        >
          <div className="card-image" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <img src={selectedCard.imageUrl} alt={selectedCard.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="card-effect-overlay">
            <CardEffectDisplay card={selectedCard} />
          </div>
          {selectedDots.length > 0 && (
            <div className="persistent-spices">
              {selectedDots.map((type, i) => (
                <div key={`overlay-${i}`} className="persistent-spice-dot" style={{ backgroundColor: PLACED_CUBE_COLORS[type] }} />
              ))}
            </div>
          )}
          {selectedPlacedType && (
            <div className="placed-cube-indicator" style={{ backgroundColor: PLACED_CUBE_COLORS[selectedPlacedType] }} />
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
