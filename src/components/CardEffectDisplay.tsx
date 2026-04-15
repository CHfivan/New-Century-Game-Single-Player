/**
 * Shared card effect display — colored spice squares in a column with ↓ arrow.
 * Used by MerchantCardRow and PlayerHand.
 */

import React from 'react'
import { MerchantCard, SpiceCollection, SpiceType } from '../types/game'
import { isSpiceCard, isConversionCard, isExchangeCard } from '../types'

const SpiceSquares: React.FC<{ spices: SpiceCollection }> = ({ spices }) => {
  const entries = (
    [
      { type: 'yellow' as SpiceType, count: spices.yellow },
      { type: 'red' as SpiceType, count: spices.red },
      { type: 'green' as SpiceType, count: spices.green },
      { type: 'brown' as SpiceType, count: spices.brown },
    ] as Array<{ type: SpiceType; count: number }>
  ).filter(e => e.count > 0)

  return (
    <>
      {entries.map(({ type, count }) =>
        Array.from({ length: count }).map((_, i) => (
          <span key={`${type}-${i}`} className={`spice-sq spice-sq-${type}`} />
        ))
      )}
    </>
  )
}

export const CardEffectDisplay: React.FC<{ card: MerchantCard }> = React.memo(({ card }) => {
  if (isSpiceCard(card)) {
    return (
      <div className="card-effect-col">
        <SpiceSquares spices={card.effect.spices} />
      </div>
    )
  }

  if (isConversionCard(card)) {
    return (
      <div className="card-effect-col">
        {Array.from({ length: card.effect.upgrades }).map((_, i) => (
          <span key={i} className="upgrade-arrow">↑</span>
        ))}
      </div>
    )
  }

  if (isExchangeCard(card)) {
    return (
      <div className="card-effect-col">
        <SpiceSquares spices={card.effect.input} />
        <span className="down-arrow">↓</span>
        <SpiceSquares spices={card.effect.output} />
      </div>
    )
  }

  return null
})
