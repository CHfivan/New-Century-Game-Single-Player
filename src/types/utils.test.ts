import { describe, it, expect } from 'vitest'
import {
  createEmptySpiceCollection,
  getTotalSpices,
  hasEnoughSpices,
  addSpices,
  subtractSpices,
  areSpicesEqual,
  getNextSpiceType,
  getPreviousSpiceType,
  calculateSpiceValue,
  formatSpices,
  getSpiceColor,
  getSpiceName,
} from './utils'

describe('Spice Utility Functions', () => {
  describe('createEmptySpiceCollection', () => {
    it('creates a collection with all zeros', () => {
      const spices = createEmptySpiceCollection()
      expect(spices).toEqual({
        yellow: 0,
        red: 0,
        green: 0,
        brown: 0,
      })
    })
  })

  describe('getTotalSpices', () => {
    it('calculates total spices correctly', () => {
      const spices = { yellow: 2, red: 3, green: 1, brown: 4 }
      expect(getTotalSpices(spices)).toBe(10)
    })

    it('returns 0 for empty collection', () => {
      const spices = createEmptySpiceCollection()
      expect(getTotalSpices(spices)).toBe(0)
    })
  })

  describe('hasEnoughSpices', () => {
    it('returns true when available >= required', () => {
      const available = { yellow: 5, red: 3, green: 2, brown: 1 }
      const required = { yellow: 2, red: 1, green: 1, brown: 0 }
      expect(hasEnoughSpices(available, required)).toBe(true)
    })

    it('returns false when any spice is insufficient', () => {
      const available = { yellow: 5, red: 1, green: 2, brown: 1 }
      const required = { yellow: 2, red: 3, green: 1, brown: 0 }
      expect(hasEnoughSpices(available, required)).toBe(false)
    })
  })

  describe('addSpices', () => {
    it('adds two collections correctly', () => {
      const a = { yellow: 2, red: 1, green: 0, brown: 3 }
      const b = { yellow: 1, red: 2, green: 1, brown: 0 }
      const result = addSpices(a, b)
      expect(result).toEqual({ yellow: 3, red: 3, green: 1, brown: 3 })
    })
  })

  describe('subtractSpices', () => {
    it('subtracts collections correctly', () => {
      const a = { yellow: 5, red: 3, green: 2, brown: 1 }
      const b = { yellow: 2, red: 1, green: 1, brown: 0 }
      const result = subtractSpices(a, b)
      expect(result).toEqual({ yellow: 3, red: 2, green: 1, brown: 1 })
    })

    it('does not go below zero', () => {
      const a = { yellow: 2, red: 1, green: 0, brown: 0 }
      const b = { yellow: 5, red: 3, green: 1, brown: 2 }
      const result = subtractSpices(a, b)
      expect(result).toEqual({ yellow: 0, red: 0, green: 0, brown: 0 })
    })
  })

  describe('areSpicesEqual', () => {
    it('returns true for equal collections', () => {
      const a = { yellow: 2, red: 1, green: 3, brown: 0 }
      const b = { yellow: 2, red: 1, green: 3, brown: 0 }
      expect(areSpicesEqual(a, b)).toBe(true)
    })

    it('returns false for different collections', () => {
      const a = { yellow: 2, red: 1, green: 3, brown: 0 }
      const b = { yellow: 2, red: 2, green: 3, brown: 0 }
      expect(areSpicesEqual(a, b)).toBe(false)
    })
  })

  describe('getNextSpiceType', () => {
    it('returns correct next spice in chain', () => {
      expect(getNextSpiceType('yellow')).toBe('red')
      expect(getNextSpiceType('red')).toBe('green')
      expect(getNextSpiceType('green')).toBe('brown')
    })

    it('returns null for highest value spice', () => {
      expect(getNextSpiceType('brown')).toBe(null)
    })
  })

  describe('getPreviousSpiceType', () => {
    it('returns correct previous spice in chain', () => {
      expect(getPreviousSpiceType('brown')).toBe('green')
      expect(getPreviousSpiceType('green')).toBe('red')
      expect(getPreviousSpiceType('red')).toBe('yellow')
    })

    it('returns null for lowest value spice', () => {
      expect(getPreviousSpiceType('yellow')).toBe(null)
    })
  })

  describe('calculateSpiceValue', () => {
    it('counts only non-yellow spices', () => {
      const spices = { yellow: 5, red: 2, green: 1, brown: 3 }
      expect(calculateSpiceValue(spices)).toBe(6)
    })

    it('returns 0 when only yellow spices', () => {
      const spices = { yellow: 10, red: 0, green: 0, brown: 0 }
      expect(calculateSpiceValue(spices)).toBe(0)
    })
  })

  describe('formatSpices', () => {
    it('formats spices correctly', () => {
      const spices = { yellow: 2, red: 1, green: 0, brown: 3 }
      expect(formatSpices(spices)).toBe('2Y 1R 3B')
    })

    it('returns "None" for empty collection', () => {
      const spices = createEmptySpiceCollection()
      expect(formatSpices(spices)).toBe('None')
    })
  })

  describe('getSpiceColor', () => {
    it('returns correct colors for each spice type', () => {
      expect(getSpiceColor('yellow')).toBe('#FFD700')
      expect(getSpiceColor('red')).toBe('#DC143C')
      expect(getSpiceColor('green')).toBe('#228B22')
      expect(getSpiceColor('brown')).toBe('#8B4513')
    })
  })

  describe('getSpiceName', () => {
    it('returns correct names for each spice type', () => {
      expect(getSpiceName('yellow')).toBe('Turmeric')
      expect(getSpiceName('red')).toBe('Saffron')
      expect(getSpiceName('green')).toBe('Cardamom')
      expect(getSpiceName('brown')).toBe('Cinnamon')
    })
  })
})
