/**
 * Card animation utilities using react-spring
 */

import { SpringConfig } from '@react-spring/web'

/**
 * Animation configuration for card movements
 */
export const cardAnimationConfig: SpringConfig = {
  tension: 280,
  friction: 60,
  mass: 1,
}

/**
 * Fast animation for quick transitions
 */
export const fastAnimationConfig: SpringConfig = {
  tension: 400,
  friction: 40,
  mass: 0.5,
}

/**
 * Slow animation for emphasis
 */
export const slowAnimationConfig: SpringConfig = {
  tension: 180,
  friction: 80,
  mass: 1.5,
}

/**
 * Animation states for cards
 */
export interface CardAnimationState {
  x: number
  y: number
  scale: number
  opacity: number
  rotateZ: number
}

/**
 * Default card animation state
 */
export const defaultCardState: CardAnimationState = {
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  rotateZ: 0,
}

/**
 * Card appearing from deck animation
 */
export const cardAppearState: CardAnimationState = {
  x: 0,
  y: -100,
  scale: 0.5,
  opacity: 0,
  rotateZ: 0,
}

/**
 * Card sliding left animation
 */
export const cardSlideLeftState = (distance: number): CardAnimationState => ({
  x: -distance,
  y: 0,
  scale: 1,
  opacity: 1,
  rotateZ: 0,
})

/**
 * Card moving to play area animation
 */
export const cardToPlayAreaState: CardAnimationState = {
  x: 0,
  y: -200,
  scale: 1.1,
  opacity: 1,
  rotateZ: 5,
}

/**
 * Error shake animation keyframes
 */
export const shakeKeyframes = [
  { x: 0 },
  { x: -10 },
  { x: 10 },
  { x: -10 },
  { x: 10 },
  { x: 0 },
]
