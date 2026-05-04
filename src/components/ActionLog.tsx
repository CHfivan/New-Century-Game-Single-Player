/**
 * ActionLog component
 * Displays a scrollable overlay listing what each player did on their turn.
 * Shows play, acquire, claim, and rest actions with colored spice cube icons.
 */

import React from 'react'
import type { MerchantCard, SpiceCollection, SpiceType } from '../types/game'
import { isSpiceCard, isConversionCard, isExchangeCard } from '../types'
import './ActionLog.css'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ActionLogEntry {
  playerName: string
  actionType: 'play' | 'acquire' | 'claim' | 'rest'
  description: string
  turnNumber: number
  /** Optional card for rendering colored cube effects inline */
  card?: MerchantCard
  /** VP for claim actions */
  points?: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const CUBE_COLORS: Record<SpiceType, string> = {
  yellow: 'action-log-cube-yellow',
  red: 'action-log-cube-red',
  green: 'action-log-cube-green',
  brown: 'action-log-cube-brown',
}

/** Render colored cubes for a SpiceCollection */
function renderSpiceCubes(spices: SpiceCollection): React.ReactNode[] {
  const cubes: React.ReactNode[] = []
  const types: SpiceType[] = ['yellow', 'red', 'green', 'brown']
  for (const t of types) {
    for (let i = 0; i < spices[t]; i++) {
      cubes.push(
        <span key={`${t}-${i}`} className={`action-log-cube ${CUBE_COLORS[t]}`} />
      )
    }
  }
  return cubes
}

/** Render a merchant card's effect as inline colored cubes */
function renderCardEffect(card: MerchantCard): React.ReactNode {
  if (isSpiceCard(card)) {
    return <>{renderSpiceCubes(card.effect.spices)}</>
  }

  if (isExchangeCard(card)) {
    return (
      <>
        {renderSpiceCubes(card.effect.input)}
        <span className="action-log-arrow">→</span>
        {renderSpiceCubes(card.effect.output)}
      </>
    )
  }

  if (isConversionCard(card)) {
    return (
      <span className="action-log-upgrade">
        Upgrade ×{card.effect.upgrades}
      </span>
    )
  }

  return null
}

/** Render the description part of a log entry */
function renderEntryContent(entry: ActionLogEntry): React.ReactNode {
  const { actionType, card, points } = entry

  switch (actionType) {
    case 'play':
      return (
        <>
          <span className="action-log-action-type"> played </span>
          {card ? renderCardEffect(card) : entry.description}
        </>
      )
    case 'acquire':
      return (
        <>
          <span className="action-log-action-type"> acquired </span>
          {card ? renderCardEffect(card) : entry.description}
        </>
      )
    case 'claim':
      return (
        <span className="action-log-action-type">
          {' '}claimed {points ?? '?'} VP card
        </span>
      )
    case 'rest':
      return (
        <span className="action-log-action-type"> rested</span>
      )
    default:
      return <span className="action-log-action-type"> {entry.description}</span>
  }
}

// ── Component ───────────────────────────────────────────────────────────────

interface ActionLogProps {
  entries: ActionLogEntry[]
  onClose: () => void
}

export const ActionLog: React.FC<ActionLogProps> = ({ entries, onClose }) => {
  return (
    <div className="action-log-overlay" onClick={onClose}>
      <div className="action-log-window" onClick={(e) => e.stopPropagation()}>
        <div className="action-log-header">
          <h2 className="action-log-title">Action History</h2>
          <button className="action-log-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {entries.length > 0 ? (
          <ul className="action-log-list">
            {entries.map((entry, index) => (
              <li key={index} className="action-log-entry">
                <span className="action-log-turn">#{entry.turnNumber}</span>
                <span className="action-log-text">
                  <span className="action-log-player-name">{entry.playerName}</span>
                  {renderEntryContent(entry)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="action-log-empty">No actions yet</div>
        )}
      </div>
    </div>
  )
}
