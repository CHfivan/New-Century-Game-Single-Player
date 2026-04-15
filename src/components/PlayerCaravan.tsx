/**
 * PlayerCaravan component
 * Displays player's caravan in fixed bottom-left position
 */

import React from 'react'
import { Caravan, SpiceType } from '../types'
import { CaravanGrid } from './CaravanGrid'
import './PlayerCaravan.css'

interface PlayerCaravanProps {
  caravan: Caravan
  playerName: string
  onCubeClick?: (type: SpiceType, index: number) => void
  pickedCubeIndex?: number | null
  usedIndices?: Set<number>
  playedCardsCount?: number
  onPlayedCardsClick?: () => void
}

export const PlayerCaravan: React.FC<PlayerCaravanProps> = ({
  caravan,
  playerName,
  onCubeClick,
  pickedCubeIndex = null,
  usedIndices,
  playedCardsCount = 0,
  onPlayedCardsClick,
}) => {
  const totalSpices = caravan.yellow + caravan.red + caravan.green + caravan.brown

  return (
    <div className="player-caravan-fixed" role="region" aria-label={`${playerName}'s caravan: ${totalSpices} of 10 spices`}>
      {onPlayedCardsClick && (
        <button className="played-cards-btn" onClick={onPlayedCardsClick} aria-label={`View played cards (${playedCardsCount})`} title={`View ${playedCardsCount} played cards`}>
          Played ({playedCardsCount})
        </button>
      )}
      <div className="caravan-header">
        <h3>{playerName}'s Caravan</h3>
        <span className="spice-count" aria-label={`${totalSpices} of 10 spices`}>{totalSpices}/10</span>
      </div>
      <CaravanGrid
        caravan={caravan}
        onCubeClick={onCubeClick}
        pickedCubeIndex={pickedCubeIndex}
        usedIndices={usedIndices}
      />
    </div>
  )
}
