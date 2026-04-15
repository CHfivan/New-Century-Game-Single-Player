/**
 * Spice cube animation utilities
 */

import { SpringConfig } from '@react-spring/web'

/**
 * Animation configuration for spice movements
 */
export const spiceAnimationConfig: SpringConfig = {
  tension: 300,
  friction: 50,
  mass: 0.8,
}

/**
 * Animation states for spice cubes
 */
export interface SpiceAnimationState {
  x: number
  y: number
  z: number
  scale: number
  opacity: number
}

/**
 * Default spice animation state
 */
export const defaultSpiceState: SpiceAnimationState = {
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  opacity: 1,
}

/**
 * Spice appearing animation
 */
export const spiceAppearState: SpiceAnimationState = {
  x: 0,
  y: 0,
  z: 0,
  scale: 0,
  opacity: 0,
}

/**
 * Spice moving to caravan animation
 */
export const spiceToCaravanState = (targetX: number, targetY: number): SpiceAnimationState => ({
  x: targetX,
  y: targetY,
  z: 0,
  scale: 1,
  opacity: 1,
})

/**
 * Spice being placed on card animation
 */
export const spiceOnCardState = (cardX: number, cardY: number): SpiceAnimationState => ({
  x: cardX,
  y: cardY,
  z: 0.5,
  scale: 0.8,
  opacity: 1,
})

/**
 * Spice disappearing animation
 */
export const spiceDisappearState: SpiceAnimationState = {
  x: 0,
  y: 0,
  z: 0,
  scale: 0,
  opacity: 0,
}
