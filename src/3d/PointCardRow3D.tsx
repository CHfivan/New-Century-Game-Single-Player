/**
 * PointCardRow3D component
 * Arranges 5 point cards in a horizontal row with coin indicators
 */

import React from 'react'
import { Card3D } from './Card3D'
import { PointCard } from '../types'
import { Text } from '@react-three/drei'

interface PointCardRow3DProps {
  cards: PointCard[]
  coinPositions: { gold: boolean; silver: boolean }
  onCardClick?: (cardIndex: number) => void
  disabled?: boolean
  basePosition?: [number, number, number]
  animateEntry?: boolean
}

export const PointCardRow3D: React.FC<PointCardRow3DProps> = ({
  cards,
  coinPositions,
  onCardClick,
  disabled = false,
  basePosition = [0, 0, 0],
  animateEntry = false,
}) => {
  const cardSpacing = 2.5
  const startX = basePosition[0] - (cardSpacing * 2) // Center the row

  return (
    <group position={basePosition}>
      {cards.map((card, index) => (
        <group key={card.id}>
          {/* Card */}
          <Card3D
            imageUrl={card.imageUrl}
            position={[startX + index * cardSpacing, 0, 0]}
            onClick={() => onCardClick?.(index)}
            disabled={disabled}
            animateEntry={animateEntry}
          />

          {/* Coin indicators */}
          {index === 0 && coinPositions.gold && (
            <Text
              position={[startX + index * cardSpacing, 2, 0]}
              fontSize={0.5}
              color="gold"
              anchorX="center"
              anchorY="middle"
            >
              🪙 Gold
            </Text>
          )}
          {index === 1 && coinPositions.silver && (
            <Text
              position={[startX + index * cardSpacing, 2, 0]}
              fontSize={0.5}
              color="silver"
              anchorX="center"
              anchorY="middle"
            >
              🪙 Silver
            </Text>
          )}
        </group>
      ))}
    </group>
  )
}
