import { describe, it, expect } from 'vitest'
import {
  loadMerchantCards,
  loadPointCards,
  getMerchantCardById,
  getPointCardById,
  getMerchantCardsByType,
  shuffleArray,
  createMerchantDeck,
  createPointDeck,
} from './cardLoader'

describe('Card Loader', () => {
  describe('loadMerchantCards', () => {
    it('loads all merchant cards', () => {
      const cards = loadMerchantCards()
      expect(cards.length).toBeGreaterThan(0)
      expect(cards[0]).toHaveProperty('id')
      expect(cards[0]).toHaveProperty('type')
      expect(cards[0]).toHaveProperty('effect')
      expect(cards[0]).toHaveProperty('imageUrl')
    })

    it('loads cards with correct types', () => {
      const cards = loadMerchantCards()
      const types = cards.map(card => card.type)
      expect(types).toContain('spice')
      expect(types).toContain('conversion')
      expect(types).toContain('exchange')
    })
  })

  describe('loadPointCards', () => {
    it('loads all point cards', () => {
      const cards = loadPointCards()
      expect(cards.length).toBeGreaterThan(0)
      expect(cards[0]).toHaveProperty('id')
      expect(cards[0]).toHaveProperty('requiredSpices')
      expect(cards[0]).toHaveProperty('points')
      expect(cards[0]).toHaveProperty('imageUrl')
    })

    it('loads cards with valid point values', () => {
      const cards = loadPointCards()
      cards.forEach(card => {
        expect(card.points).toBeGreaterThan(0)
      })
    })
  })

  describe('getMerchantCardById', () => {
    it('returns card when ID exists', () => {
      const card = getMerchantCardById('merchant_1')
      expect(card).toBeDefined()
      expect(card?.id).toBe('merchant_1')
    })

    it('returns undefined when ID does not exist', () => {
      const card = getMerchantCardById('nonexistent_card')
      expect(card).toBeUndefined()
    })
  })

  describe('getPointCardById', () => {
    it('returns card when ID exists', () => {
      const card = getPointCardById('point_1')
      expect(card).toBeDefined()
      expect(card?.id).toBe('point_1')
    })

    it('returns undefined when ID does not exist', () => {
      const card = getPointCardById('nonexistent_card')
      expect(card).toBeUndefined()
    })
  })

  describe('getMerchantCardsByType', () => {
    it('filters spice cards correctly', () => {
      const cards = getMerchantCardsByType('spice')
      expect(cards.length).toBeGreaterThan(0)
      cards.forEach(card => {
        expect(card.type).toBe('spice')
      })
    })

    it('filters conversion cards correctly', () => {
      const cards = getMerchantCardsByType('conversion')
      expect(cards.length).toBeGreaterThan(0)
      cards.forEach(card => {
        expect(card.type).toBe('conversion')
      })
    })

    it('filters exchange cards correctly', () => {
      const cards = getMerchantCardsByType('exchange')
      expect(cards.length).toBeGreaterThan(0)
      cards.forEach(card => {
        expect(card.type).toBe('exchange')
      })
    })
  })

  describe('shuffleArray', () => {
    it('returns array with same length', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      expect(shuffled.length).toBe(original.length)
    })

    it('contains all original elements', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      original.forEach(item => {
        expect(shuffled).toContain(item)
      })
    })

    it('does not modify original array', () => {
      const original = [1, 2, 3, 4, 5]
      const originalCopy = [...original]
      shuffleArray(original)
      expect(original).toEqual(originalCopy)
    })
  })

  describe('createMerchantDeck', () => {
    it('creates a deck with all merchant cards', () => {
      const deck = createMerchantDeck()
      const allCards = loadMerchantCards()
      expect(deck.length).toBe(allCards.length)
    })

    it('creates different orders on multiple calls', () => {
      const deck1 = createMerchantDeck()
      const deck2 = createMerchantDeck()
      
      // Very unlikely to be identical if shuffled properly
      const identical = deck1.every((card, index) => card.id === deck2[index]?.id)
      expect(identical).toBe(false)
    })
  })

  describe('createPointDeck', () => {
    it('creates a deck with all point cards', () => {
      const deck = createPointDeck()
      const allCards = loadPointCards()
      expect(deck.length).toBe(allCards.length)
    })

    it('creates different orders on multiple calls', () => {
      const deck1 = createPointDeck()
      const deck2 = createPointDeck()
      
      // Very unlikely to be identical if shuffled properly
      const identical = deck1.every((card, index) => card.id === deck2[index]?.id)
      expect(identical).toBe(false)
    })
  })
})
