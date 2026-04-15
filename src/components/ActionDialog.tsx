/**
 * ActionDialog component
 * Modal dialogs for multi-step game actions (conversion, exchange, acquire, discard)
 * Implements Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */

import React, { useState } from 'react'
import {
  MerchantCard,
  SpiceCollection,
  SpiceType,
  PlayConversionCardPayload,
  PlayExchangeCardPayload,
  AcquireCardPayload,
} from '../types/game'
import { isConversionCard, isExchangeCard, getTotalSpices, hasEnoughSpices, subtractSpices, addSpices } from '../types'
import { formatCardEffect } from '../data'
import './ActionDialog.css'

const CUBE_COLORS: Record<SpiceType, string> = {
  yellow: '#DAA520',
  red: '#C0392B',
  green: '#27AE60',
  brown: '#7B4F2E',
}

/** Build a flat array of spice types from a SpiceCollection */
function caravanToArray(caravan: SpiceCollection): SpiceType[] {
  const arr: SpiceType[] = []
  for (let i = 0; i < caravan.yellow; i++) arr.push('yellow')
  for (let i = 0; i < caravan.red; i++) arr.push('red')
  for (let i = 0; i < caravan.green; i++) arr.push('green')
  for (let i = 0; i < caravan.brown; i++) arr.push('brown')
  return arr
}

/** Render a row of colored spice cubes */
const SpiceCubes: React.FC<{ spices: SpiceCollection }> = ({ spices }) => {
  const arr = caravanToArray(spices)
  return (
    <span className="spice-cubes-inline">
      {arr.map((type, i) => (
        <span key={i} className="cube-inline" style={{ backgroundColor: CUBE_COLORS[type] }} />
      ))}
    </span>
  )
}

// ─── Conversion Dialog ────────────────────────────────────────────────────────

interface ConversionDialogProps {
  card: MerchantCard
  caravan: SpiceCollection
  onConfirm: (payload: PlayConversionCardPayload) => void
  onCancel: () => void
}

export const ConversionDialog: React.FC<ConversionDialogProps> = ({
  card,
  caravan,
  onConfirm,
  onCancel,
}) => {
  if (!isConversionCard(card)) return null

  const maxUpgrades = card.effect.upgrades
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  // Spice value chain: yellow(0) → red(1) → green(2) → brown(3)
  const CHAIN: SpiceType[] = ['yellow', 'red', 'green', 'brown']
  const chainIndex = (t: SpiceType) => CHAIN.indexOf(t)

  type ConversionOption = {
    conversions: Array<{ from: SpiceType; to: SpiceType }>
    inputSpices: SpiceCollection
    outputSpices: SpiceCollection
  }

  // Generate all valid ways to spend exactly `stepsLeft` upgrade steps
  // on cubes from the caravan. Each cube can be upgraded 1+ levels (each level = 1 step).
  // A cube at level i can be upgraded to level i+k using k steps (max level = brown = 3).
  const generateOptions = (): ConversionOption[] => {
    const results: ConversionOption[] = []
    const seen = new Set<string>()

    // Available cubes that can be upgraded (not brown)
    const upgradeable: SpiceType[] = []
    for (const t of ['yellow', 'red', 'green'] as SpiceType[]) {
      for (let i = 0; i < caravan[t]; i++) upgradeable.push(t)
    }

    // Recursive: pick cubes and assign steps to each
    // assignments: array of { from: SpiceType, steps: number } — how many steps each picked cube gets
    const recurse = (
      stepsUsed: number,
      startIdx: number,
      assignments: Array<{ cubeType: SpiceType; steps: number }>
    ) => {
      if (stepsUsed > 0) {
        // Build the conversion list and input/output for this assignment
        const conversions: Array<{ from: SpiceType; to: SpiceType }> = []
        const input: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
        const output: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }

        for (const a of assignments) {
          const fromIdx = chainIndex(a.cubeType)
          const toIdx = fromIdx + a.steps
          const toType = CHAIN[toIdx]!
          input[a.cubeType]++
          output[toType]++
          // Each step is a single-level conversion in sequence
          for (let s = 0; s < a.steps; s++) {
            conversions.push({ from: CHAIN[fromIdx + s]!, to: CHAIN[fromIdx + s + 1]! })
          }
        }

        // Deduplicate by sorting input/output signature
        const key = JSON.stringify({ i: input, o: output })
        if (!seen.has(key)) {
          seen.add(key)
          // Verify we have enough cubes in caravan
          let valid = true
          const tempCaravan = { ...caravan }
          for (const a of assignments) {
            if (tempCaravan[a.cubeType] <= 0) { valid = false; break }
            tempCaravan[a.cubeType]--
          }
          if (valid) {
            results.push({ conversions, inputSpices: input, outputSpices: output })
          }
        }
      }

      if (stepsUsed >= maxUpgrades) return

      // Try assigning steps to the next cube
      for (let i = startIdx; i < upgradeable.length; i++) {
        const cubeType = upgradeable[i]!
        const fromIdx = chainIndex(cubeType)
        const maxStepsForCube = Math.min(maxUpgrades - stepsUsed, 3 - fromIdx) // can't go past brown

        for (let steps = 1; steps <= maxStepsForCube; steps++) {
          recurse(
            stepsUsed + steps,
            i + 1, // move to next cube (no reuse)
            [...assignments, { cubeType, steps }]
          )
        }
      }
    }

    recurse(0, 0, [])
    return results
  }

  const options = generateOptions()

  const handleConfirm = () => {
    if (selectedOption === null) return
    const opt = options[selectedOption]!
    onConfirm({ cardId: card.id, conversions: opt.conversions })
  }

  return (
    <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label="Upgrade spices dialog" onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
        <h3>Upgrade Spices</h3>
        <div className="action-dialog-body">
          <div className="action-dialog-info">
            Select an upgrade option (up to {maxUpgrades})
          </div>
          <div className="visual-options" role="radiogroup" aria-label="Upgrade options">
            {options.map((opt, i) => (
              <div
                key={i}
                className={`visual-option ${selectedOption === i ? 'selected' : ''}`}
                onClick={() => setSelectedOption(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOption(i) } }}
                role="radio"
                aria-checked={selectedOption === i}
                tabIndex={0}
                aria-label={`Upgrade option ${i + 1}`}
              >
                <SpiceCubes spices={opt.inputSpices} />
                <span className="option-arrow">→</span>
                <SpiceCubes spices={opt.outputSpices} />
              </div>
            ))}
          </div>
        </div>
        <div className="action-dialog-footer">
          <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel upgrade">Cancel</button>
          <button className="dialog-btn confirm" onClick={handleConfirm} disabled={selectedOption === null} aria-label="Confirm upgrade">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Exchange Dialog ──────────────────────────────────────────────────────────

interface ExchangeDialogProps {
  card: MerchantCard
  caravan: SpiceCollection
  onConfirm: (payload: PlayExchangeCardPayload) => void
  onCancel: () => void
}

export const ExchangeDialog: React.FC<ExchangeDialogProps> = ({
  card,
  caravan,
  onConfirm,
  onCancel,
}) => {
  if (!isExchangeCard(card)) return null
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  // Generate options for 1x, 2x, 3x... exchanges
  type ExchangeOption = {
    count: number
    totalInput: SpiceCollection
    totalOutput: SpiceCollection
  }

  const options: ExchangeOption[] = []
  let testCaravan = { ...caravan }
  for (let count = 1; count <= 10; count++) {
    if (!hasEnoughSpices(testCaravan, card.effect.input)) break
    testCaravan = subtractSpices(testCaravan, card.effect.input)
    const afterAdd = addSpices(testCaravan, card.effect.output)
    if (getTotalSpices(afterAdd) > 10) break
    testCaravan = afterAdd

    // Build total input/output for this count
    const totalInput: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
    const totalOutput: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
    for (const t of ['yellow', 'red', 'green', 'brown'] as SpiceType[]) {
      totalInput[t] = card.effect.input[t] * count
      totalOutput[t] = card.effect.output[t] * count
    }
    options.push({ count, totalInput, totalOutput })
  }

  const handleConfirm = () => {
    if (selectedOption === null) return
    const opt = options[selectedOption]!
    onConfirm({ cardId: card.id, exchangeCount: opt.count })
  }

  return (
    <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label="Exchange spices dialog" onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
        <h3>Exchange Spices</h3>
        <div className="action-dialog-body">
          <div className="action-dialog-info">Select how many times to exchange</div>
          <div className="visual-options" role="radiogroup" aria-label="Exchange options">
            {options.map((opt, i) => (
              <div
                key={i}
                className={`visual-option ${selectedOption === i ? 'selected' : ''}`}
                onClick={() => setSelectedOption(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOption(i) } }}
                role="radio"
                aria-checked={selectedOption === i}
                tabIndex={0}
                aria-label={`Exchange ${opt.count} time${opt.count !== 1 ? 's' : ''}`}
              >
                <SpiceCubes spices={opt.totalInput} />
                <span className="option-arrow">→</span>
                <SpiceCubes spices={opt.totalOutput} />
                <span className="option-count">×{opt.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="action-dialog-footer">
          <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel exchange">Cancel</button>
          <button className="dialog-btn confirm" onClick={handleConfirm} disabled={selectedOption === null} aria-label="Confirm exchange">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Acquire Dialog ───────────────────────────────────────────────────────────

interface AcquireDialogProps {
  cardIndex: number
  caravan: SpiceCollection
  onConfirm: (payload: AcquireCardPayload) => void
  onCancel: () => void
}

export const AcquireDialog: React.FC<AcquireDialogProps> = ({
  cardIndex,
  caravan,
  onConfirm,
  onCancel,
}) => {
  const cost = cardIndex

  const [spicesToPay, setSpicesToPay] = useState<SpiceCollection>({
    yellow: 0, red: 0, green: 0, brown: 0,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const totalPaid = getTotalSpices(spicesToPay)

  const canAdd = (type: SpiceType): boolean => {
    return totalPaid < cost && caravan[type] > spicesToPay[type]
  }

  const canRemove = (type: SpiceType): boolean => {
    return spicesToPay[type] > 0
  }

  const adjust = (type: SpiceType, delta: number) => {
    setSpicesToPay(prev => ({ ...prev, [type]: prev[type] + delta }))
  }

  const isValid = totalPaid === cost

  const handleConfirm = () => {
    onConfirm({ cardIndex, spicesToPay })
  }

  const spiceTypes: Array<{ type: SpiceType; label: string }> = [
    { type: 'yellow', label: 'Yellow' },
    { type: 'red', label: 'Red' },
    { type: 'green', label: 'Green' },
    { type: 'brown', label: 'Brown' },
  ]

  if (cost === 0) {
    return (
      <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
        <div className="action-dialog" role="dialog" aria-modal="true" aria-label="Acquire free card dialog" onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
          <h3>Acquire Card</h3>
          <div className="action-dialog-body">
            <div className="action-dialog-info">This card is free (first position)!</div>
          </div>
          <div className="action-dialog-footer">
            <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel acquisition">Cancel</button>
            <button className="dialog-btn confirm" onClick={() => onConfirm({ cardIndex, spicesToPay: { yellow: 0, red: 0, green: 0, brown: 0 } })} aria-label="Confirm acquisition">Confirm</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label={`Acquire card dialog - pay ${cost} spices`} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
        <h3>Acquire Card</h3>
        <div className="action-dialog-body">
          <div className="acquire-info">Pay {cost} spice{cost !== 1 ? 's' : ''}</div>
          <div className="acquire-spice-controls">
            {spiceTypes.map(({ type, label }) => (
              <div key={type} className="acquire-spice-row">
                <span className="spice-label">
                  <span className={`spice-dot ${type}`} aria-hidden="true" />
                  {label} ({caravan[type]})
                </span>
                <div className="acquire-count">
                  <button onClick={() => adjust(type, -1)} disabled={!canRemove(type)} aria-label={`Remove one ${label} spice`}>−</button>
                  <span aria-label={`${spicesToPay[type]} ${label} spices selected`}>{spicesToPay[type]}</span>
                  <button onClick={() => adjust(type, 1)} disabled={!canAdd(type)} aria-label={`Add one ${label} spice`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className={`acquire-total ${!isValid && totalPaid > 0 ? 'wrong-amount' : ''}`} aria-live="polite">
            {totalPaid}/{cost} spices selected
          </div>
        </div>
        <div className="action-dialog-footer">
          <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel acquisition">Cancel</button>
          <button className="dialog-btn confirm" onClick={handleConfirm} disabled={!isValid} aria-label="Confirm acquisition">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Discard Dialog ───────────────────────────────────────────────────────────

interface DiscardDialogProps {
  caravan: SpiceCollection
  onConfirm: (toDiscard: SpiceCollection) => void
  onCancel: () => void
}

export const DiscardDialog: React.FC<DiscardDialogProps> = ({
  caravan,
  onConfirm,
  onCancel,
}) => {
  const MAX_CARAVAN = 10
  const currentTotal = getTotalSpices(caravan)
  const mustDiscard = currentTotal - MAX_CARAVAN

  // Build flat array of cubes and track which are selected for discard
  const cubes = caravanToArray(caravan)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const toggleCube = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else if (next.size < mustDiscard) {
        next.add(index)
      }
      return next
    })
  }

  const isValid = selectedIndices.size === mustDiscard

  const handleConfirm = () => {
    // Convert selected indices back to SpiceCollection
    const toDiscard: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
    for (const idx of selectedIndices) {
      toDiscard[cubes[idx]!]++
    }
    onConfirm(toDiscard)
  }

  return (
    <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label={`Caravan overflow - discard ${mustDiscard} spices`} onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
        <h3>Caravan Overflow!</h3>
        <div className="action-dialog-body">
          <div className="discard-info">
            Your caravan has {currentTotal} spices (max {MAX_CARAVAN}).
            Tap {mustDiscard} cube{mustDiscard !== 1 ? 's' : ''} to discard.
          </div>
          <div className="discard-caravan-grid" role="group" aria-label="Select spices to discard">
            {cubes.map((type, i) => (
              <div
                key={i}
                className={`discard-cube ${selectedIndices.has(i) ? 'marked' : ''}`}
                style={{ backgroundColor: CUBE_COLORS[type] }}
                onClick={() => toggleCube(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCube(i) } }}
                role="checkbox"
                aria-checked={selectedIndices.has(i)}
                aria-label={`${type} spice cube ${i + 1}${selectedIndices.has(i) ? ' - marked for discard' : ''}`}
                tabIndex={0}
              />
            ))}
          </div>
          <div className={`discard-total ${selectedIndices.size > mustDiscard ? 'over-limit' : ''}`} aria-live="polite">
            {selectedIndices.size}/{mustDiscard} selected to discard
          </div>
        </div>
        <div className="action-dialog-footer">
          <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel and undo action">Cancel Action</button>
          <button className="dialog-btn confirm" onClick={handleConfirm} disabled={!isValid} aria-label="Confirm discard">Confirm Discard</button>
        </div>
      </div>
    </div>
  )
}

// ─── PlayCardDialog (selects which card to play) ──────────────────────────────

interface PlayCardDialogProps {
  cards: MerchantCard[]
  onSelectCard: (card: MerchantCard) => void
  onCancel: () => void
}

export const PlayCardDialog: React.FC<PlayCardDialogProps> = ({
  cards,
  onSelectCard,
  onCancel,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="action-dialog-overlay" role="presentation" onClick={onCancel}>
      <div className="action-dialog" role="dialog" aria-modal="true" aria-label="Select a card to play" onKeyDown={handleKeyDown} onClick={(e) => e.stopPropagation()}>
        <h3>Play a Card</h3>
        <div className="action-dialog-body">
          <div className="action-dialog-info">Select a card from your hand to play</div>
          <div className="conversion-controls" role="list" aria-label="Cards in hand">
            {cards.map(card => (
              <button
                key={card.id}
                className="dialog-btn confirm"
                style={{ marginBottom: 4, width: '100%' }}
                onClick={() => onSelectCard(card)}
                aria-label={`Play card: ${formatCardEffect(card)}`}
                role="listitem"
              >
                {formatCardEffect(card)}
              </button>
            ))}
          </div>
        </div>
        <div className="action-dialog-footer">
          <button className="dialog-btn cancel" onClick={onCancel} aria-label="Cancel play card">Cancel</button>
        </div>
      </div>
    </div>
  )
}
