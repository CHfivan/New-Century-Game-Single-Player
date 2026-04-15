/**
 * Utility functions for working with game types
 */

import { SpiceCollection, SpiceType, PlayerStatistics } from './game'

/**
 * Create an empty spice collection
 */
export function createEmptySpiceCollection(): SpiceCollection {
  return {
    yellow: 0,
    red: 0,
    green: 0,
    brown: 0,
  }
}

/**
 * Calculate total spices in a collection
 */
export function getTotalSpices(spices: SpiceCollection): number {
  return spices.yellow + spices.red + spices.green + spices.brown
}

/**
 * Check if collection A has at least as many spices as collection B
 */
export function hasEnoughSpices(
  available: SpiceCollection,
  required: SpiceCollection
): boolean {
  return (
    available.yellow >= required.yellow &&
    available.red >= required.red &&
    available.green >= required.green &&
    available.brown >= required.brown
  )
}

/**
 * Add two spice collections together
 */
export function addSpices(
  a: SpiceCollection,
  b: SpiceCollection
): SpiceCollection {
  return {
    yellow: a.yellow + b.yellow,
    red: a.red + b.red,
    green: a.green + b.green,
    brown: a.brown + b.brown,
  }
}

/**
 * Subtract spice collection B from collection A
 */
export function subtractSpices(
  a: SpiceCollection,
  b: SpiceCollection
): SpiceCollection {
  return {
    yellow: Math.max(0, a.yellow - b.yellow),
    red: Math.max(0, a.red - b.red),
    green: Math.max(0, a.green - b.green),
    brown: Math.max(0, a.brown - b.brown),
  }
}

/**
 * Clone a spice collection
 */
export function cloneSpices(spices: SpiceCollection): SpiceCollection {
  return { ...spices }
}

/**
 * Check if two spice collections are equal
 */
export function areSpicesEqual(
  a: SpiceCollection,
  b: SpiceCollection
): boolean {
  return (
    a.yellow === b.yellow &&
    a.red === b.red &&
    a.green === b.green &&
    a.brown === b.brown
  )
}

/**
 * Get the next spice type in the value chain
 */
export function getNextSpiceType(spice: SpiceType): SpiceType | null {
  const chain: SpiceType[] = ['yellow', 'red', 'green', 'brown']
  const index = chain.indexOf(spice)
  if (index === -1 || index >= chain.length - 1) return null
  const next = chain[index + 1]
  return next ?? null
}

/**
 * Get the previous spice type in the value chain
 */
export function getPreviousSpiceType(spice: SpiceType): SpiceType | null {
  const chain: SpiceType[] = ['yellow', 'red', 'green', 'brown']
  const index = chain.indexOf(spice)
  if (index <= 0) return null
  const prev = chain[index - 1]
  return prev ?? null
}

/**
 * Calculate the value of non-yellow spices (for final scoring)
 */
export function calculateSpiceValue(spices: SpiceCollection): number {
  return spices.red + spices.green + spices.brown
}

/**
 * Create empty player statistics
 */
export function createEmptyStatistics(): PlayerStatistics {
  return {
    cubesGained: createEmptySpiceCollection(),
    cubesSpent: createEmptySpiceCollection(),
    merchantCardsPlayed: 0,
    merchantCardsAcquired: 0,
    restActionsTaken: 0,
    cardUsageCount: new Map(),
    pointProgression: [],
    turnTimings: [],
    turnStartTime: null,
  }
}

/**
 * Format spice collection as a readable string
 */
export function formatSpices(spices: SpiceCollection): string {
  const parts: string[] = []
  if (spices.yellow > 0) parts.push(`${spices.yellow}Y`)
  if (spices.red > 0) parts.push(`${spices.red}R`)
  if (spices.green > 0) parts.push(`${spices.green}G`)
  if (spices.brown > 0) parts.push(`${spices.brown}B`)
  return parts.length > 0 ? parts.join(' ') : 'None'
}

/**
 * Get spice color for rendering
 */
export function getSpiceColor(spice: SpiceType): string {
  const colors: Record<SpiceType, string> = {
    yellow: '#FFD700',  // Gold
    red: '#DC143C',     // Crimson
    green: '#228B22',   // Forest Green
    brown: '#8B4513',   // Saddle Brown
  }
  return colors[spice]
}

/**
 * Get spice name
 */
export function getSpiceName(spice: SpiceType): string {
  const names: Record<SpiceType, string> = {
    yellow: 'Turmeric',
    red: 'Saffron',
    green: 'Cardamom',
    brown: 'Cinnamon',
  }
  return names[spice]
}
