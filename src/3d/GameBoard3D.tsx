/**
 * GameBoard3D component
 * Main 3D scene that composes all game elements
 */

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { MerchantCardRow3D } from './MerchantCardRow3D'
import { PointCardRow3D } from './PointCardRow3D'
import { PlayerCaravan3D } from './PlayerCaravan3D'
import { GameState } from '../types'

interface GameBoard3DProps {
  gameState: GameState
  onMerchantCardClick?: (cardIndex: number) => void
  onPointCardClick?: (cardIndex: number) => void
  disabled?: boolean
}

export const GameBoard3D: React.FC<GameBoard3DProps> = ({
  gameState,
  onMerchantCardClick,
  onPointCardClick,
  disabled = false,
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={[0, 5, 15]}
            fov={50}
          />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <pointLight position={[-10, -10, -5]} intensity={0.4} />

          {/* Merchant Card Row */}
          <MerchantCardRow3D
            cards={gameState.merchantCardRow}
            onCardClick={onMerchantCardClick}
            disabled={disabled}
            basePosition={[0, 2, 0]}
          />

          {/* Point Card Row */}
          <PointCardRow3D
            cards={gameState.pointCardRow}
            coinPositions={gameState.coinPositions}
            onCardClick={onPointCardClick}
            disabled={disabled}
            basePosition={[0, -2, 0]}
          />

          {/* Player Caravan */}
          <PlayerCaravan3D
            caravan={currentPlayer.caravan}
            position={[-8, -3, 0]}
          />

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={30}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
