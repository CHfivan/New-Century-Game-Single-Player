/**
 * Statistics tracking utility for player actions and performance
 */

import { PlayerStatistics, SpiceCollection } from '../types'

/**
 * Simple cache for expensive statistics calculations.
 * Keyed by a hash of the relevant stats fields.
 */
const statsCache = new WeakMap<PlayerStatistics, Map<string, number>>();

function getCachedValue(stats: PlayerStatistics, key: string): number | undefined {
  return statsCache.get(stats)?.get(key)
}

function setCachedValue(stats: PlayerStatistics, key: string, value: number): number {
  let cache = statsCache.get(stats)
  if (!cache) {
    cache = new Map()
    statsCache.set(stats, cache)
  }
  cache.set(key, value)
  return value
}

/**
 * Utility class for tracking and calculating player statistics
 */
export class StatisticsTracker {
  /**
   * Record spices gained by a player
   */
  static recordCubeGain(
    stats: PlayerStatistics,
    spices: SpiceCollection
  ): PlayerStatistics {
    return {
      ...stats,
      cubesGained: {
        yellow: stats.cubesGained.yellow + spices.yellow,
        red: stats.cubesGained.red + spices.red,
        green: stats.cubesGained.green + spices.green,
        brown: stats.cubesGained.brown + spices.brown,
      },
    }
  }

  /**
   * Record spices spent by a player
   */
  static recordCubeSpend(
    stats: PlayerStatistics,
    spices: SpiceCollection
  ): PlayerStatistics {
    return {
      ...stats,
      cubesSpent: {
        yellow: stats.cubesSpent.yellow + spices.yellow,
        red: stats.cubesSpent.red + spices.red,
        green: stats.cubesSpent.green + spices.green,
        brown: stats.cubesSpent.brown + spices.brown,
      },
    }
  }

  /**
   * Record a card being played
   */
  static recordCardPlay(
    stats: PlayerStatistics,
    cardId: string
  ): PlayerStatistics {
    const newCardUsageCount = new Map(stats.cardUsageCount)
    const currentCount = newCardUsageCount.get(cardId) || 0
    newCardUsageCount.set(cardId, currentCount + 1)

    return {
      ...stats,
      merchantCardsPlayed: stats.merchantCardsPlayed + 1,
      cardUsageCount: newCardUsageCount,
    }
  }

  /**
   * Record a card being acquired
   */
  static recordCardAcquisition(stats: PlayerStatistics): PlayerStatistics {
    return {
      ...stats,
      merchantCardsAcquired: stats.merchantCardsAcquired + 1,
    }
  }

  /**
   * Record a rest action
   */
  static recordRest(stats: PlayerStatistics): PlayerStatistics {
    return {
      ...stats,
      restActionsTaken: stats.restActionsTaken + 1,
    }
  }

  /**
   * Start tracking a turn (record start time)
   */
  static startTurn(stats: PlayerStatistics): PlayerStatistics {
    return {
      ...stats,
      turnStartTime: Date.now(),
    }
  }

  /**
   * End tracking a turn (record duration and update point progression)
   */
  static endTurn(
    stats: PlayerStatistics,
    currentPoints: number,
    turnNumber: number
  ): PlayerStatistics {
    const turnDuration = stats.turnStartTime
      ? Date.now() - stats.turnStartTime
      : 0

    return {
      ...stats,
      turnTimings: [...stats.turnTimings, turnDuration],
      turnStartTime: null,
      pointProgression: [
        ...stats.pointProgression,
        { turn: turnNumber, points: currentPoints },
      ],
    }
  }

  /**
   * Calculate conversion efficiency (cubes gained per cube spent)
   */
  static calculateConversionEfficiency(stats: PlayerStatistics): number {
    const cached = getCachedValue(stats, 'conversionEfficiency')
    if (cached !== undefined) return cached

    const totalGained =
      stats.cubesGained.yellow +
      stats.cubesGained.red +
      stats.cubesGained.green +
      stats.cubesGained.brown

    const totalSpent =
      stats.cubesSpent.yellow +
      stats.cubesSpent.red +
      stats.cubesSpent.green +
      stats.cubesSpent.brown

    if (totalSpent === 0) return setCachedValue(stats, 'conversionEfficiency', 0)

    return setCachedValue(stats, 'conversionEfficiency', totalGained / totalSpent)
  }

  /**
   * Calculate average value per turn (points gained per turn)
   */
  static calculateAverageValuePerTurn(stats: PlayerStatistics): number {
    const cached = getCachedValue(stats, 'avgValuePerTurn')
    if (cached !== undefined) return cached

    if (stats.pointProgression.length === 0) return setCachedValue(stats, 'avgValuePerTurn', 0)

    const finalPoints =
      stats.pointProgression[stats.pointProgression.length - 1]?.points || 0
    const totalTurns = stats.pointProgression.length

    return setCachedValue(stats, 'avgValuePerTurn', finalPoints / totalTurns)
  }

  /**
   * Calculate average time per turn (in milliseconds)
   */
  static calculateAverageTimePerTurn(stats: PlayerStatistics): number {
    const cached = getCachedValue(stats, 'avgTimePerTurn')
    if (cached !== undefined) return cached

    if (stats.turnTimings.length === 0) return setCachedValue(stats, 'avgTimePerTurn', 0)

    const totalTime = stats.turnTimings.reduce((sum, time) => sum + time, 0)
    return setCachedValue(stats, 'avgTimePerTurn', totalTime / stats.turnTimings.length)
  }

  /**
   * Get the most frequently used card
   */
  static getMostUsedCard(stats: PlayerStatistics): {
    cardId: string
    count: number
  } | null {
    if (stats.cardUsageCount.size === 0) return null

    let maxCardId = ''
    let maxCount = 0

    stats.cardUsageCount.forEach((count, cardId) => {
      if (count > maxCount) {
        maxCount = count
        maxCardId = cardId
      }
    })

    return maxCardId ? { cardId: maxCardId, count: maxCount } : null
  }

  /**
   * Calculate total cubes gained
   */
  static getTotalCubesGained(stats: PlayerStatistics): number {
    return (
      stats.cubesGained.yellow +
      stats.cubesGained.red +
      stats.cubesGained.green +
      stats.cubesGained.brown
    )
  }

  /**
   * Calculate total cubes spent
   */
  static getTotalCubesSpent(stats: PlayerStatistics): number {
    return (
      stats.cubesSpent.yellow +
      stats.cubesSpent.red +
      stats.cubesSpent.green +
      stats.cubesSpent.brown
    )
  }
}
