/**
 * Card loader utility for loading and parsing card data from JSON
 */

import { MerchantCard, PointCard } from '../types'
import merchantCardsData from './merchant-cards.json'
import pointCardsData from './point-cards.json'

/**
 * Load all merchant cards from JSON data
 */
export function loadMerchantCards(): MerchantCard[] {
  return merchantCardsData as MerchantCard[]
}

/**
 * Load all point cards from JSON data
 */
export function loadPointCards(): PointCard[] {
  return pointCardsData as PointCard[]
}

/**
 * Get a merchant card by ID
 */
export function getMerchantCardById(id: string): MerchantCard | undefined {
  const cards = loadMerchantCards()
  return cards.find(card => card.id === id)
}

/**
 * Get a point card by ID
 */
export function getPointCardById(id: string): PointCard | undefined {
  const cards = loadPointCards()
  return cards.find(card => card.id === id)
}

/**
 * Get merchant cards by type
 */
export function getMerchantCardsByType(type: 'spice' | 'conversion' | 'exchange'): MerchantCard[] {
  const cards = loadMerchantCards()
  return cards.filter(card => card.type === type)
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}

/**
 * Create a shuffled deck of merchant cards
 */
export function createMerchantDeck(): MerchantCard[] {
  const cards = loadMerchantCards()
  return shuffleArray(cards)
}

/**
 * Create a shuffled deck of point cards
 */
export function createPointDeck(): PointCard[] {
  const cards = loadPointCards()
  return shuffleArray(cards)
}
