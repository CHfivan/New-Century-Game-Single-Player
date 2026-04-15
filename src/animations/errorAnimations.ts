/**
 * Error feedback animation utilities
 */

import { SpringConfig } from '@react-spring/web'

/**
 * Fast animation for error feedback
 */
export const errorAnimationConfig: SpringConfig = {
  tension: 500,
  friction: 30,
  mass: 0.5,
}

/**
 * Shake animation configuration
 */
export const shakeConfig: SpringConfig = {
  tension: 600,
  friction: 20,
  mass: 0.3,
}

/**
 * Error animation states
 */
export interface ErrorAnimationState {
  x: number
  backgroundColor: string
  borderColor: string
  scale: number
}

/**
 * Default error state
 */
export const defaultErrorState: ErrorAnimationState = {
  x: 0,
  backgroundColor: 'transparent',
  borderColor: '#333',
  scale: 1,
}

/**
 * Error highlight state (red)
 */
export const errorHighlightState: ErrorAnimationState = {
  x: 0,
  backgroundColor: 'rgba(220, 38, 38, 0.1)',
  borderColor: '#DC2626',
  scale: 1,
}

/**
 * Shake animation sequence
 */
export const shakeSequence = [
  { x: 0 },
  { x: -10 },
  { x: 10 },
  { x: -8 },
  { x: 8 },
  { x: -5 },
  { x: 5 },
  { x: 0 },
]

/**
 * Generate shake keyframes for custom distance
 */
export const generateShakeKeyframes = (distance: number) => [
  { x: 0 },
  { x: -distance },
  { x: distance },
  { x: -distance * 0.8 },
  { x: distance * 0.8 },
  { x: -distance * 0.5 },
  { x: distance * 0.5 },
  { x: 0 },
]
