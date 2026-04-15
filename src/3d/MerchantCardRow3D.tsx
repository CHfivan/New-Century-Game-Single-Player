/**
 * MerchantCardRow3D component
 * Arranges 6 merchant cards in a horizontal row in 3D space
 */

import React from 'react'
import { Card3D } from './Card3D'
import { MerchantCard } from '../types'

interface MerchantCardRow3DProps {
  cards: MerchantCard[]
  onCardClick?: (cardIndex: number) => void
  disabled?: boolean
  basePosition?: [number, number, number]
  animateEntry?: boolean
}

export const MerchantCardRow3D: React.FC<MerchantCardRow3DProps> = ({
  cards,
  onCardClick,
  disabled = false,
  basePosition = [0, 0, 0],
  animateEntry = false,
}) => {
  const cardSpacing = 2.5
  const startX = basePosition[0] - (cardSpacing * 2.5) // Center the row

  return (
    <group position={basePosition}>
      {cards.map((card, index) => (
        <Card3D
          key={card.id}
          imageUrl={card.imageUrl}
          position={[startX + index * cardSpacing, 0, 0]}
          onClick={() => onCardClick?.(index)}
          disabled={disabled}
          animateEntry={animateEntry}
        />
      ))}
    </group>
  )
}
