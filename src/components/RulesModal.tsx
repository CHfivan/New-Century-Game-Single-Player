/**
 * RulesModal component
 * Displays game rules and card explanations in a scrollable modal
 * Accessible from main menu and during game via HamburgerMenu
 * Requirements: 18.4
 */

import React, { useRef, useEffect } from 'react'
import './RulesModal.css'

interface RulesModalProps {
  onClose: () => void
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
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

    modal.addEventListener('keydown', handleKeyDown)
    return () => modal.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="rules-overlay" onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Game rules"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rules-header">
          <h2>📖 Game Rules</h2>
          <button className="rules-close" onClick={onClose} aria-label="Close rules">
            ✕
          </button>
        </div>

        <div className="rules-body">
          <h3>Objective</h3>
          <p>
            Collect spices and trade them to claim point cards. The player with the
            most points when the game ends wins.
          </p>

          <h3>Spices</h3>
          <p>There are four spice types in ascending value:</p>
          <div className="rules-spice-legend">
            <span className="rules-spice-item">
              <span className="rules-spice-dot" style={{ background: '#FFD700' }} />
              Turmeric (Yellow)
            </span>
            <span className="rules-spice-item">
              <span className="rules-spice-dot" style={{ background: '#DC143C' }} />
              Saffron (Red)
            </span>
            <span className="rules-spice-item">
              <span className="rules-spice-dot" style={{ background: '#228B22' }} />
              Cardamom (Green)
            </span>
            <span className="rules-spice-item">
              <span className="rules-spice-dot" style={{ background: '#8B4513' }} />
              Cinnamon (Brown)
            </span>
          </div>
          <p>Your caravan holds a maximum of 10 spice cubes.</p>

          <h3>Actions (pick one per turn)</h3>
          <ul>
            <li>
              <strong>Play a Card</strong> — Play a merchant card from your hand to
              gain spices, upgrade spices, or exchange spices.
            </li>
            <li>
              <strong>Acquire a Card</strong> — Take a merchant card from the market
              row. The first card is free; each card further right costs one spice
              placed on each card to its left.
            </li>
            <li>
              <strong>Rest</strong> — Return all your played cards back to your hand.
            </li>
            <li>
              <strong>Claim a Point Card</strong> — Spend the required spices to claim
              a point card from the market row.
            </li>
          </ul>

          <h3>Card Types</h3>
          <ul>
            <li>
              <strong>Spice Cards</strong> — Add the depicted spices to your caravan.
            </li>
            <li>
              <strong>Conversion Cards</strong> — Upgrade spices up the value chain
              (Yellow → Red → Green → Brown). The number on the card shows how many
              upgrade steps you can perform.
            </li>
            <li>
              <strong>Exchange Cards</strong> — Trade a set of input spices for output
              spices. You may repeat the exchange multiple times if you have enough
              resources.
            </li>
          </ul>

          <h3>Coins</h3>
          <p>
            Gold coins (worth 3 points) sit above the first point card. Silver coins
            (worth 1 point) sit above the second. When you claim a point card from
            those positions, you also take a coin.
          </p>

          <h3>Game End</h3>
          <p>
            The game ends when any player claims their 5th point card (in 2-3 player
            games) or 6th point card (in 4-5 player games). The current round
            finishes so every player gets an equal number of turns.
          </p>

          <h3>Scoring</h3>
          <ul>
            <li>Point card values</li>
            <li>Gold coins: 3 points each</li>
            <li>Silver coins: 1 point each</li>
            <li>Non-yellow spices remaining: 1 point each</li>
          </ul>
          <p>Ties are broken in favor of the player later in turn order.</p>
        </div>
      </div>
    </div>
  )
}
