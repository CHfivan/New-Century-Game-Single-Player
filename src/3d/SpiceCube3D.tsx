/**
 * SpiceCube3D component
 * Renders a spice as a 3D cube with appropriate color
 */

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { SpiceType } from '../types'
import { spiceAnimationConfig } from '../animations/spiceAnimations'

interface SpiceCube3DProps {
  spiceType: SpiceType
  position?: [number, number, number]
  animated?: boolean
  animateEntry?: boolean
}

// Color mapping for spice types
const SPICE_COLORS: Record<SpiceType, string> = {
  yellow: '#FFD700',  // Gold
  red: '#DC143C',     // Crimson
  green: '#228B22',   // Forest Green
  brown: '#8B4513',   // Saddle Brown
}

export const SpiceCube3D: React.FC<SpiceCube3DProps> = ({
  spiceType,
  position = [0, 0, 0],
  animated = false,
  animateEntry = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)

  // Entry animation
  const { entryScale, entryOpacity } = useSpring({
    from: animateEntry ? { entryScale: 0, entryOpacity: 0 } : { entryScale: 1, entryOpacity: 1 },
    to: { entryScale: 1, entryOpacity: 1 },
    config: spiceAnimationConfig,
  })

  // Optional rotation animation
  useFrame((state) => {
    if (meshRef.current && animated) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime) * 0.2
    }
  })

  const AnimatedMesh = animated('mesh')

  return (
    <AnimatedMesh
      ref={meshRef}
      position={position}
      scale={entryScale.to((s) => [s, s, s])}
    >
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <animated.meshStandardMaterial
        color={SPICE_COLORS[spiceType]}
        metalness={0.3}
        roughness={0.4}
        opacity={entryOpacity}
        transparent
      />
    </AnimatedMesh>
  )
}
