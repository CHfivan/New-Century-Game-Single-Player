/**
 * PlayerCaravan3D component
 * Displays spice cubes in player's caravan, grouped by type
 */

import React from 'react'
import { SpiceCube3D } from './SpiceCube3D'
import { SpiceCollection, SpiceType } from '../types'

interface PlayerCaravan3DProps {
  caravan: SpiceCollection
  position?: [number, number, number]
  animateEntry?: boolean
}

export const PlayerCaravan3D: React.FC<PlayerCaravan3DProps> = ({
  caravan,
  position = [-8, -3, 0],
  animateEntry = false,
}) => {
  // Convert caravan to array of spice types
  const spices: SpiceType[] = []
  const spiceOrder: SpiceType[] = ['yellow', 'red', 'green', 'brown']

  spiceOrder.forEach((type) => {
    for (let i = 0; i < caravan[type]; i++) {
      spices.push(type)
    }
  })

  // Arrange cubes in a grid (5 columns max)
  const cubesPerRow = 5
  const cubeSpacing = 0.6

  return (
    <group position={position}>
      {spices.map((spiceType, index) => {
        const row = Math.floor(index / cubesPerRow)
        const col = index % cubesPerRow
        return (
          <SpiceCube3D
            key={`${spiceType}-${index}`}
            spiceType={spiceType}
            position={[col * cubeSpacing, -row * cubeSpacing, 0]}
            animateEntry={animateEntry}
          />
        )
      })}
    </group>
  )
}
