import { describe, it, expect } from 'vitest'
import { formatCardEffect, formatCardEffectVerbose, getCardDescription } from './cardFormatter'
import { MerchantCard } from '../types'

describe('Card Formatter', () => {
  describe('formatCardEffect', () => {
    it('formats spice card with single spice type', () => {
      const card: MerchantCard = {
        id: 'test_spice',
        type: 'spice',
        effect: {
          spices: { yellow: 2, red: 0, green: 0, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffect(card)).toBe('YY')
    })

    it('formats spice card with multiple spice types', () => {
      const card: MerchantCard = {
        id: 'test_spice',
        type: 'spice',
        effect: {
          spices: { yellow: 1, red: 2, green: 0, brown: 1 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffect(card)).toBe('Y RR B')
    })

    it('formats conversion card', () => {
      const card: MerchantCard = {
        id: 'test_conversion',
        type: 'conversion',
        effect: {
          upgrades: 3
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffect(card)).toBe('↑↑↑')
    })

    it('formats exchange card', () => {
      const card: MerchantCard = {
        id: 'test_exchange',
        type: 'exchange',
        effect: {
          input: { yellow: 2, red: 0, green: 0, brown: 0 },
          output: { yellow: 0, red: 1, green: 0, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffect(card)).toBe('YY → R')
    })

    it('formats complex exchange card', () => {
      const card: MerchantCard = {
        id: 'test_exchange',
        type: 'exchange',
        effect: {
          input: { yellow: 2, red: 1, green: 0, brown: 0 },
          output: { yellow: 0, red: 0, green: 2, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffect(card)).toBe('YYR → GG')
    })
  })

  describe('formatCardEffectVerbose', () => {
    it('formats spice card verbosely', () => {
      const card: MerchantCard = {
        id: 'test_spice',
        type: 'spice',
        effect: {
          spices: { yellow: 2, red: 1, green: 0, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffectVerbose(card)).toBe('Gain: 2 Turmeric, 1 Saffron')
    })

    it('formats conversion card verbosely', () => {
      const card: MerchantCard = {
        id: 'test_conversion',
        type: 'conversion',
        effect: {
          upgrades: 2
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffectVerbose(card)).toBe('Upgrade 2 spices')
    })

    it('formats single upgrade correctly', () => {
      const card: MerchantCard = {
        id: 'test_conversion',
        type: 'conversion',
        effect: {
          upgrades: 1
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffectVerbose(card)).toBe('Upgrade 1 spice')
    })

    it('formats exchange card verbosely', () => {
      const card: MerchantCard = {
        id: 'test_exchange',
        type: 'exchange',
        effect: {
          input: { yellow: 3, red: 0, green: 0, brown: 0 },
          output: { yellow: 0, red: 0, green: 1, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(formatCardEffectVerbose(card)).toBe('Trade: 3 Turmeric for 1 Cardamom')
    })
  })

  describe('getCardDescription', () => {
    it('returns correct description for spice card', () => {
      const card: MerchantCard = {
        id: 'test',
        type: 'spice',
        effect: { spices: { yellow: 1, red: 0, green: 0, brown: 0 } },
        imageUrl: '/test.png'
      }
      expect(getCardDescription(card)).toBe('Spice Card')
    })

    it('returns correct description for conversion card', () => {
      const card: MerchantCard = {
        id: 'test',
        type: 'conversion',
        effect: { upgrades: 2 },
        imageUrl: '/test.png'
      }
      expect(getCardDescription(card)).toBe('Conversion Card')
    })

    it('returns correct description for exchange card', () => {
      const card: MerchantCard = {
        id: 'test',
        type: 'exchange',
        effect: {
          input: { yellow: 2, red: 0, green: 0, brown: 0 },
          output: { yellow: 0, red: 1, green: 0, brown: 0 }
        },
        imageUrl: '/test.png'
      }
      expect(getCardDescription(card)).toBe('Exchange Card')
    })
  })
})
