/**
 * Default game configuration based on official Century: Spice Road rules
 */

import { GameConfig } from './game'

export const DEFAULT_CONFIG: GameConfig = {
  maxCaravanSize: 10,
  
  startingCards: {
    spiceCard: 'merchant_1',
    upgradeCard: 'merchant_2'
  },
  
  startingSpices: {
    player1: { 
      yellow: 3, 
      red: 0, 
      green: 0, 
      brown: 0 
    },
    player2_3: { 
      yellow: 4, 
      red: 0, 
      green: 0, 
      brown: 0 
    },
    player4_5: { 
      yellow: 3, 
      red: 1, 
      green: 0, 
      brown: 0 
    }
  },
  
  coinSetup: {
    goldCount: 5,
    silverCount: 10
  },
  
  victoryCardThreshold: {
    players2_3: 5,
    players4_5: 6
  },
  
  merchantRowSize: 6,
  pointRowSize: 5
}

/**
 * Helper function to get starting spices based on player seat position.
 * Player 1 (index 0): 3 yellow
 * Players 2-3 (index 1-2): 4 yellow
 * Players 4-5 (index 3-4): 3 yellow + 1 red (saffron)
 */
export function getStartingSpices(playerIndex: number, _totalPlayers: number) {
  if (playerIndex === 0) {
    return { ...DEFAULT_CONFIG.startingSpices.player1 }
  } else if (playerIndex <= 2) {
    return { ...DEFAULT_CONFIG.startingSpices.player2_3 }
  } else {
    return { ...DEFAULT_CONFIG.startingSpices.player4_5 }
  }
}

/**
 * Helper function to get victory card threshold based on player count
 */
export function getVictoryThreshold(playerCount: number): number {
  return playerCount <= 3 
    ? DEFAULT_CONFIG.victoryCardThreshold.players2_3
    : DEFAULT_CONFIG.victoryCardThreshold.players4_5
}
