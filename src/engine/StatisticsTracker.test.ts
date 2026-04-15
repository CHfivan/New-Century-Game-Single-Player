import { describe, it, expect } from 'vitest'
import { StatisticsTracker } from './StatisticsTracker'
import { createEmptyStatistics } from '../types'

describe('StatisticsTracker', () => {
  describe('recordCubeGain', () => {
    it('should add gained spices to statistics', () => {
      const stats = createEmptyStatistics()
      const spices = { yellow: 2, red: 1, green: 0, brown: 0 }
      
      const newStats = StatisticsTracker.recordCubeGain(stats, spices)
      
      expect(newStats.cubesGained.yellow).toBe(2)
      expect(newStats.cubesGained.red).toBe(1)
      expect(newStats.cubesGained.green).toBe(0)
      expect(newStats.cubesGained.brown).toBe(0)
    })

    it('should accumulate multiple gains', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCubeGain(stats, { yellow: 2, red: 0, green: 0, brown: 0 })
      stats = StatisticsTracker.recordCubeGain(stats, { yellow: 1, red: 1, green: 0, brown: 0 })
      
      expect(stats.cubesGained.yellow).toBe(3)
      expect(stats.cubesGained.red).toBe(1)
    })
  })

  describe('recordCubeSpend', () => {
    it('should add spent spices to statistics', () => {
      const stats = createEmptyStatistics()
      const spices = { yellow: 1, red: 2, green: 1, brown: 0 }
      
      const newStats = StatisticsTracker.recordCubeSpend(stats, spices)
      
      expect(newStats.cubesSpent.yellow).toBe(1)
      expect(newStats.cubesSpent.red).toBe(2)
      expect(newStats.cubesSpent.green).toBe(1)
      expect(newStats.cubesSpent.brown).toBe(0)
    })
  })

  describe('recordCardPlay', () => {
    it('should increment merchant cards played counter', () => {
      const stats = createEmptyStatistics()
      
      const newStats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      
      expect(newStats.merchantCardsPlayed).toBe(1)
    })

    it('should track card usage count', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_2')
      
      expect(stats.cardUsageCount.get('merchant_1')).toBe(2)
      expect(stats.cardUsageCount.get('merchant_2')).toBe(1)
      expect(stats.merchantCardsPlayed).toBe(3)
    })
  })

  describe('recordCardAcquisition', () => {
    it('should increment merchant cards acquired counter', () => {
      const stats = createEmptyStatistics()
      
      const newStats = StatisticsTracker.recordCardAcquisition(stats)
      
      expect(newStats.merchantCardsAcquired).toBe(1)
    })
  })

  describe('recordRest', () => {
    it('should increment rest actions counter', () => {
      const stats = createEmptyStatistics()
      
      const newStats = StatisticsTracker.recordRest(stats)
      
      expect(newStats.restActionsTaken).toBe(1)
    })
  })

  describe('startTurn and endTurn', () => {
    it('should record turn start time', () => {
      const stats = createEmptyStatistics()
      
      const newStats = StatisticsTracker.startTurn(stats)
      
      expect(newStats.turnStartTime).toBeGreaterThan(0)
    })

    it('should record turn duration and point progression', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.startTurn(stats)
      
      // Simulate some time passing
      const startTime = stats.turnStartTime!
      stats.turnStartTime = startTime - 100 // Simulate 100ms ago
      
      stats = StatisticsTracker.endTurn(stats, 5, 1)
      
      expect(stats.turnTimings.length).toBe(1)
      expect(stats.turnTimings[0]).toBeGreaterThanOrEqual(100)
      expect(stats.turnStartTime).toBeNull()
      expect(stats.pointProgression.length).toBe(1)
      expect(stats.pointProgression[0]).toEqual({ turn: 1, points: 5 })
    })
  })

  describe('calculateConversionEfficiency', () => {
    it('should return 0 when no spices spent', () => {
      const stats = createEmptyStatistics()
      
      const efficiency = StatisticsTracker.calculateConversionEfficiency(stats)
      
      expect(efficiency).toBe(0)
    })

    it('should calculate efficiency correctly', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCubeGain(stats, { yellow: 10, red: 0, green: 0, brown: 0 })
      stats = StatisticsTracker.recordCubeSpend(stats, { yellow: 5, red: 0, green: 0, brown: 0 })
      
      const efficiency = StatisticsTracker.calculateConversionEfficiency(stats)
      
      expect(efficiency).toBe(2) // 10 gained / 5 spent = 2
    })
  })

  describe('calculateAverageValuePerTurn', () => {
    it('should return 0 when no turns played', () => {
      const stats = createEmptyStatistics()
      
      const avg = StatisticsTracker.calculateAverageValuePerTurn(stats)
      
      expect(avg).toBe(0)
    })

    it('should calculate average correctly', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.endTurn(stats, 5, 1)
      stats = StatisticsTracker.endTurn(stats, 10, 2)
      stats = StatisticsTracker.endTurn(stats, 15, 3)
      
      const avg = StatisticsTracker.calculateAverageValuePerTurn(stats)
      
      expect(avg).toBe(5) // 15 points / 3 turns = 5
    })
  })

  describe('calculateAverageTimePerTurn', () => {
    it('should return 0 when no turns played', () => {
      const stats = createEmptyStatistics()
      
      const avg = StatisticsTracker.calculateAverageTimePerTurn(stats)
      
      expect(avg).toBe(0)
    })

    it('should calculate average correctly', () => {
      let stats = createEmptyStatistics()
      stats.turnTimings = [100, 200, 300]
      
      const avg = StatisticsTracker.calculateAverageTimePerTurn(stats)
      
      expect(avg).toBe(200) // (100 + 200 + 300) / 3 = 200
    })
  })

  describe('getMostUsedCard', () => {
    it('should return null when no cards used', () => {
      const stats = createEmptyStatistics()
      
      const result = StatisticsTracker.getMostUsedCard(stats)
      
      expect(result).toBeNull()
    })

    it('should return the most frequently used card', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_1')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_2')
      stats = StatisticsTracker.recordCardPlay(stats, 'merchant_2')
      
      const result = StatisticsTracker.getMostUsedCard(stats)
      
      expect(result).toEqual({ cardId: 'merchant_1', count: 3 })
    })
  })

  describe('getTotalCubesGained', () => {
    it('should sum all gained cubes', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCubeGain(stats, { yellow: 2, red: 3, green: 1, brown: 1 })
      
      const total = StatisticsTracker.getTotalCubesGained(stats)
      
      expect(total).toBe(7)
    })
  })

  describe('getTotalCubesSpent', () => {
    it('should sum all spent cubes', () => {
      let stats = createEmptyStatistics()
      
      stats = StatisticsTracker.recordCubeSpend(stats, { yellow: 1, red: 2, green: 3, brown: 4 })
      
      const total = StatisticsTracker.getTotalCubesSpent(stats)
      
      expect(total).toBe(10)
    })
  })
})
