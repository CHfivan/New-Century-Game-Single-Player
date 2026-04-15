/**
 * Card3D component
 * Renders a card as a 3D plane with texture, hover effects, and click handling
 */

import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { cardAnimationConfig } from '../animations/cardAnimations'

interface Card3DProps {
  imageUrl: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  onClick?: () => void
  disabled?: boolean
  animateEntry?: boolean
}

export const Card3D: React.FC<Card3DProps> = ({
  imageUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onClick,
  disabled = false,
  animateEntry = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Entry animation
  const { entryScale, entryOpacity } = useSpring({
    from: animateEntry ? { entryScale: 0.5, entryOpacity: 0 } : { entryScale: 1, entryOpacity: 1 },
    to: { entryScale: 1, entryOpacity: 1 },
    config: cardAnimationConfig,
  })

  // Hover animation
  const { hoverScale } = useSpring({
    hoverScale: hovered && !disabled ? 1.1 : 1,
    config: cardAnimationConfig,
  })

  const handlePointerOver = () => {
    if (!disabled) {
      setHovered(true)
      document.body.style.cursor = 'pointer'
    }
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const AnimatedMesh = animated('mesh')

  return (
    <AnimatedMesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale.map((s, i) => s * hoverScale.get() * entryScale.get()) as [number, number, number]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[2, 3]} />
      <animated.meshStandardMaterial
        color={hovered ? '#ffffff' : '#e0e0e0'}
        side={THREE.DoubleSide}
        emissive={hovered ? '#4CAF50' : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
        opacity={entryOpacity}
        transparent
      />
    </AnimatedMesh>
  )
}
