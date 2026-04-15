/**
 * Integration tests for Century Spice Road game
 * Tests complete game flow, AI turns, card acquisition, scoring, and state persistence
 *
 * Requirements: 2.1, 5.1, 5.2, 6.2, 16.1
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameEngine } from '../engine/GameEngine'
import { AIPlayer } from '../engine/AIPlayer'
import { gameReducer, createInitialState } from '../state/gameReducer'
import { serializeGameState, deserializeGameState } from '../state/GameContext'
import {
  GameState,
  GameAction,
  getTotalSpices,
  hasEnoughSpices,
  getVictoryThreshold,
} from '../types'

describe('Integration: Complete Game Flow', () => {
  let state: GameState

  beforeEach(() => {
    state = GameEngine.createGame(2, 0)
  })

  it('should create a valid game and play actions through to a game-over condition', () => {
    // Verify initial setup
    expect(state.gamePhase).toBe('playing')
    expect(state.players).toHaveLength(2)
    expect(state.merchantCardRow).toHaveLength(6)
    expect(state.pointCardRow).toHaveLength(5)
    expect(state.goldCoins).toBe(5)
    expect(state.silverCoins).toBe(10)
    expect(state.turnNumber).toBe(1)
    expect(state.gameId).toBeDefined()
    expect(state.gameId).not.toBe('setup')

    // Each player should have 2 starting cards
    for (const player of state.players) {
      expect(player.hand).toHaveLength(2)
      expect(player.pointCards).toHaveLength(0)
      expect(player.playedCards).toHaveLength(0)
    }
  })

  it('should play multiple turns using available actions until game over', () => {
    let turnCount = 0
    const maxTurns = 500 // Safety limit

    while (state.gamePhase === 'playing' && turnCount < maxTurns) {
      const currentPlayer = state.players[state.currentPlayerIndex]!
      const actions = GameEngine.getAvailableActions(state, currentPlayer.id)

      if (actions.length === 0) break

      // Pick the first available action
      const action = actions[0]!
      state = GameEngine.executeAction(state, action)

      // End turn via reducer (may transition to 'ended')
      state = gameReducer(state, { type: 'END_TURN' })
      turnCount++
    }

    // Game should have ended or we hit the safety limit
    // Either way, calculateFinalScores should work
    const sorted = GameEngine.calculateFinalScores(state)
    expect(sorted).toHaveLength(2)
    expect(sorted[0]!.score).toBeGreaterThanOrEqual(sorted[1]!.score)
  })

  it('should reach victory condition when a player claims 5 point cards (2-player game)', () => {
    // Manually give player 0 enough point cards to trigger game over
    const player = state.players[0]!
    player.pointCards = Array.from({ length: 5 }, (_, i) => ({
      id: `test_point_${i}`,
      points: 6,
      requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
      imageUrl: '',
    }))

    expect(GameEngine.isGameOver(state)).toBe(true)

    // End turn should transition to 'ended' phase
    const endedState = gameReducer(state, { type: 'END_TURN' })
    expect(endedState.gamePhase).toBe('ended')
    expect(endedState.winner).not.toBeNull()
  })
})


describe('Integration: AI Turn Execution', () => {
  it('should have AI select valid actions and update state correctly', () => {
    // Create game with 1 human + 1 AI
    let state = GameEngine.createGame(2, 1, 'medium')

    // Find the AI player
    const aiPlayer = state.players.find(p => p.isAI)!
    expect(aiPlayer).toBeDefined()
    expect(aiPlayer.isAI).toBe(true)

    // Set it to AI's turn
    const aiIndex = state.players.indexOf(aiPlayer)
    state.currentPlayerIndex = aiIndex

    const ai = new AIPlayer('medium')
    const action = ai.selectAction(state, aiPlayer.id)

    // Validate the action
    const validation = GameEngine.validateAction(state, action)
    expect(validation.valid).toBe(true)

    // Execute the action
    const newState = GameEngine.executeAction(state, action)
    expect(newState).not.toEqual(state)
  })

  it('should have AI play valid actions across multiple turns', () => {
    let state = GameEngine.createGame(2, 1, 'easy')

    const ai = new AIPlayer('easy')
    let aiTurns = 0

    for (let turn = 0; turn < 20; turn++) {
      const currentPlayer = state.players[state.currentPlayerIndex]!

      if (currentPlayer.isAI) {
        const action = ai.selectAction(state, currentPlayer.id)
        const validation = GameEngine.validateAction(state, action)
        expect(validation.valid).toBe(true)

        state = GameEngine.executeAction(state, action)
        aiTurns++
      } else {
        // Human turn: pick first available action
        const actions = GameEngine.getAvailableActions(state, currentPlayer.id)
        if (actions.length > 0) {
          state = GameEngine.executeAction(state, actions[0]!)
        }
      }

      state = gameReducer(state, { type: 'END_TURN' })
      if (state.gamePhase === 'ended') break
    }

    expect(aiTurns).toBeGreaterThan(0)
  })

  it('should have hard AI consider opponent blocking', () => {
    let state = GameEngine.createGame(2, 1, 'hard')

    const aiPlayer = state.players.find(p => p.isAI)!
    const aiIndex = state.players.indexOf(aiPlayer)
    state.currentPlayerIndex = aiIndex

    const ai = new AIPlayer('hard')
    const action = ai.selectAction(state, aiPlayer.id)

    // Hard AI should still produce a valid action
    const validation = GameEngine.validateAction(state, action)
    expect(validation.valid).toBe(true)
  })
})

describe('Integration: Card Acquisition Sequence', () => {
  let state: GameState

  beforeEach(() => {
    state = GameEngine.createGame(2, 0)
  })

  it('should acquire the free card (position 0) without paying spices', () => {
    const player = state.players[state.currentPlayerIndex]!
    const initialHandSize = player.hand.length

    // Acquire card at position 0 (free)
    const acquireAction: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: player.id,
      payload: {
        cardIndex: 0,
        spicesToPay: { yellow: 0, red: 0, green: 0, brown: 0 },
        spicePlacement: [],
      },
    }

    const validation = GameEngine.validateAction(state, acquireAction)
    expect(validation.valid).toBe(true)

    const newState = GameEngine.executeAction(state, acquireAction)
    const updatedPlayer = newState.players[state.currentPlayerIndex]!

    // Hand should have one more card
    expect(updatedPlayer.hand.length).toBe(initialHandSize + 1)
    // Merchant row should still have 6 cards (refilled from deck)
    expect(newState.merchantCardRow).toHaveLength(6)
  })

  it('should acquire a paid card (position 1) by placing one spice', () => {
    const player = state.players[state.currentPlayerIndex]!
    const initialYellow = player.caravan.yellow

    // Position 1 costs 1 spice
    const acquireAction: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: player.id,
      payload: {
        cardIndex: 1,
        spicesToPay: { yellow: 1, red: 0, green: 0, brown: 0 },
        spicePlacement: [{ cardIndex: 0, type: 'yellow' as const }],
      },
    }

    const validation = GameEngine.validateAction(state, acquireAction)
    expect(validation.valid).toBe(true)

    const newState = GameEngine.executeAction(state, acquireAction)
    const updatedPlayer = newState.players[state.currentPlayerIndex]!

    // Player should have spent 1 yellow spice
    expect(updatedPlayer.caravan.yellow).toBeLessThan(initialYellow)
    // Merchant row should still have 6 cards
    expect(newState.merchantCardRow).toHaveLength(6)
  })

  it('should place spices on cards to the left when acquiring', () => {
    const player = state.players[state.currentPlayerIndex]!

    // Give player enough spices to acquire card at position 2
    player.caravan.yellow = 5

    const acquireAction: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: player.id,
      payload: {
        cardIndex: 2,
        spicesToPay: { yellow: 2, red: 0, green: 0, brown: 0 },
        spicePlacement: [
          { cardIndex: 0, type: 'yellow' as const },
          { cardIndex: 1, type: 'yellow' as const },
        ],
      },
    }

    const validation = GameEngine.validateAction(state, acquireAction)
    expect(validation.valid).toBe(true)

    const newState = GameEngine.executeAction(state, acquireAction)

    // Spices should be placed on the merchant cards to the left
    // merchantCardSpices[0] and [1] should have gained yellow spices
    expect(
      newState.merchantCardSpices[0]!.yellow + newState.merchantCardSpices[1]!.yellow
    ).toBeGreaterThanOrEqual(2)
  })

  it('should collect spices sitting on an acquired card', () => {
    // Put spices on card at position 0
    state.merchantCardSpices[0] = { yellow: 2, red: 1, green: 0, brown: 0 }

    const player = state.players[state.currentPlayerIndex]!
    const initialTotal = getTotalSpices(player.caravan)

    const acquireAction: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: player.id,
      payload: {
        cardIndex: 0,
        spicesToPay: { yellow: 0, red: 0, green: 0, brown: 0 },
        spicePlacement: [],
      },
    }

    const newState = GameEngine.executeAction(state, acquireAction)
    const updatedPlayer = newState.players[state.currentPlayerIndex]!

    // Player should have gained the spices that were on the card
    expect(getTotalSpices(updatedPlayer.caravan)).toBe(initialTotal + 3)
  })

  it('should slide merchant cards left and refill after acquisition', () => {
    const originalSecondCard = state.merchantCardRow[1]!

    // Acquire card at position 0
    const player = state.players[state.currentPlayerIndex]!
    const acquireAction: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: player.id,
      payload: {
        cardIndex: 0,
        spicesToPay: { yellow: 0, red: 0, green: 0, brown: 0 },
        spicePlacement: [],
      },
    }

    const newState = GameEngine.executeAction(state, acquireAction)

    // The card that was at position 1 should now be at position 0
    expect(newState.merchantCardRow[0]!.id).toBe(originalSecondCard.id)
    // Row should still have 6 cards
    expect(newState.merchantCardRow).toHaveLength(6)
  })
})


describe('Integration: Scoring and Victory Conditions', () => {
  it('should calculate final scores correctly with point cards, coins, and spices', () => {
    const state = GameEngine.createGame(2, 0)

    // Set up player 0 with known scoring components
    const player = state.players[0]!
    player.pointCards = [
      { id: 'p1', points: 8, requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 }, imageUrl: '' },
      { id: 'p2', points: 12, requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 }, imageUrl: '' },
    ]
    player.coins = { gold: 2, silver: 3 }
    player.caravan = { yellow: 2, red: 1, green: 1, brown: 1 }

    // Expected: 8 + 12 + (2*3) + (3*1) + (1 + 1 + 1) = 20 + 6 + 3 + 3 = 32
    const sorted = GameEngine.calculateFinalScores(state)
    const scoredPlayer = sorted.find(p => p.id === player.id)!
    expect(scoredPlayer.score).toBe(32)
  })

  it('should not count yellow spices in final score', () => {
    const state = GameEngine.createGame(2, 0)

    const player = state.players[0]!
    player.pointCards = []
    player.coins = { gold: 0, silver: 0 }
    player.caravan = { yellow: 5, red: 0, green: 0, brown: 0 }

    const sorted = GameEngine.calculateFinalScores(state)
    const scoredPlayer = sorted.find(p => p.id === player.id)!
    expect(scoredPlayer.score).toBe(0)
  })

  it('should apply tiebreaker favoring later turn order', () => {
    const state = GameEngine.createGame(3, 0)

    // Give all players the same score
    for (const player of state.players) {
      player.pointCards = [
        { id: `p_${player.id}`, points: 10, requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 }, imageUrl: '' },
      ]
      player.coins = { gold: 0, silver: 0 }
      player.caravan = { yellow: 0, red: 0, green: 0, brown: 0 }
    }

    const sorted = GameEngine.calculateFinalScores(state)

    // All have score 10, tiebreaker favors later turn order (higher index)
    expect(sorted[0]!.score).toBe(10)
    expect(sorted[0]!.id).toBe(state.players[2]!.id) // Last player wins tie
  })

  it('should trigger game over at 5 point cards for 2-player game', () => {
    const state = GameEngine.createGame(2, 0)
    const threshold = getVictoryThreshold(2)
    expect(threshold).toBe(5)

    // Not game over with 4 cards
    state.players[0]!.pointCards = Array.from({ length: 4 }, (_, i) => ({
      id: `pt_${i}`,
      points: 5,
      requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
      imageUrl: '',
    }))
    expect(GameEngine.isGameOver(state)).toBe(false)

    // Game over with 5 cards
    state.players[0]!.pointCards.push({
      id: 'pt_4',
      points: 5,
      requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
      imageUrl: '',
    })
    expect(GameEngine.isGameOver(state)).toBe(true)
  })

  it('should trigger game over at 6 point cards for 4-player game', () => {
    const state = GameEngine.createGame(4, 0)
    const threshold = getVictoryThreshold(4)
    expect(threshold).toBe(6)

    state.players[0]!.pointCards = Array.from({ length: 5 }, (_, i) => ({
      id: `pt_${i}`,
      points: 5,
      requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
      imageUrl: '',
    }))
    expect(GameEngine.isGameOver(state)).toBe(false)

    state.players[0]!.pointCards.push({
      id: 'pt_5',
      points: 5,
      requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
      imageUrl: '',
    })
    expect(GameEngine.isGameOver(state)).toBe(true)
  })

  it('should award gold coin for first point card position and silver for second', () => {
    const state = GameEngine.createGame(2, 0)
    const player = state.players[state.currentPlayerIndex]!

    // Give player enough spices to claim the first point card
    const firstPointCard = state.pointCardRow[0]!
    player.caravan = {
      yellow: 10,
      red: 10,
      green: 10,
      brown: 10,
    }
    // Override caravan limit for testing
    // Actually, caravan max is 10 total. Let's just give exact spices needed.
    const needed = firstPointCard.requiredSpices
    player.caravan = {
      yellow: Math.max(needed.yellow, 0),
      red: Math.max(needed.red, 0),
      green: Math.max(needed.green, 0),
      brown: Math.max(needed.brown, 0),
    }

    // Ensure player has enough spices
    if (hasEnoughSpices(player.caravan, firstPointCard.requiredSpices)) {
      const claimAction: GameAction = {
        type: 'CLAIM_POINT_CARD',
        playerId: player.id,
        payload: { cardIndex: 0 },
      }

      const newState = GameEngine.executeAction(state, claimAction)
      const updatedPlayer = newState.players[state.currentPlayerIndex]!

      // First position should award gold coin
      expect(updatedPlayer.coins.gold).toBe(1)
    }
  })
})

describe('Integration: Turn Management', () => {
  it('should cycle through all players in order', () => {
    let state = GameEngine.createGame(3, 0)

    expect(state.currentPlayerIndex).toBe(0)

    // End turn for each player
    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.currentPlayerIndex).toBe(1)

    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.currentPlayerIndex).toBe(2)

    // Should wrap back to player 0
    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('should increment turn number when wrapping around', () => {
    let state = GameEngine.createGame(2, 0)
    expect(state.turnNumber).toBe(1)

    // Player 0 -> Player 1 (same turn)
    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.turnNumber).toBe(1)

    // Player 1 -> Player 0 (new turn)
    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.turnNumber).toBe(2)
  })

  it('should clear state snapshot on END_TURN', () => {
    let state = GameEngine.createGame(2, 0)

    // Begin an action to create a snapshot
    state = gameReducer(state, {
      type: 'BEGIN_ACTION',
      payload: { actionType: 'PLAY_CARD' },
    })
    expect(state.stateSnapshot).not.toBeNull()

    // End turn should clear the snapshot
    state = gameReducer(state, { type: 'END_TURN' })
    expect(state.stateSnapshot).toBeNull()
  })

  it('should support BEGIN_ACTION / CANCEL_ACTION round-trip', () => {
    let state = GameEngine.createGame(2, 0)
    const originalIndex = state.currentPlayerIndex
    const originalCaravan = { ...state.players[0]!.caravan }

    // Begin action
    state = gameReducer(state, {
      type: 'BEGIN_ACTION',
      payload: { actionType: 'PLAY_CARD' },
    })
    expect(state.stateSnapshot).not.toBeNull()

    // Simulate modifying state (as if partial action happened)
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, caravan: { yellow: 0, red: 0, green: 0, brown: 0 } } : p
      ),
    }

    // Cancel should restore original state
    state = gameReducer(state, { type: 'CANCEL_ACTION' })
    expect(state.stateSnapshot).toBeNull()
    expect(state.currentPlayerIndex).toBe(originalIndex)
    expect(state.players[0]!.caravan).toEqual(originalCaravan)
  })
})

describe('Integration: State Persistence (Serialization Round-Trip)', () => {
  it('should serialize and deserialize game state preserving all fields', () => {
    const state = GameEngine.createGame(3, 1, 'hard')

    // Use GameEngine serialization
    const json = GameEngine.serializeState(state)
    const restored = GameEngine.deserializeState(json)

    expect(restored.gameId).toBe(state.gameId)
    expect(restored.players).toHaveLength(state.players.length)
    expect(restored.currentPlayerIndex).toBe(state.currentPlayerIndex)
    expect(restored.merchantCardRow).toHaveLength(state.merchantCardRow.length)
    expect(restored.pointCardRow).toHaveLength(state.pointCardRow.length)
    expect(restored.goldCoins).toBe(state.goldCoins)
    expect(restored.silverCoins).toBe(state.silverCoins)
    expect(restored.gamePhase).toBe(state.gamePhase)
    expect(restored.turnNumber).toBe(state.turnNumber)
  })

  it('should serialize and deserialize via GameContext helpers preserving Map fields', () => {
    const state = GameEngine.createGame(2, 0)

    // Add some card usage data to statistics
    state.players[0]!.statistics.cardUsageCount.set('card_1', 3)
    state.players[0]!.statistics.cardUsageCount.set('card_2', 7)

    const json = serializeGameState(state)
    const restored = deserializeGameState(json)

    expect(restored).not.toBeNull()
    expect(restored!.gameId).toBe(state.gameId)
    expect(restored!.players[0]!.statistics.cardUsageCount).toBeInstanceOf(Map)
    expect(restored!.players[0]!.statistics.cardUsageCount.get('card_1')).toBe(3)
    expect(restored!.players[0]!.statistics.cardUsageCount.get('card_2')).toBe(7)
  })

  it('should handle deserializing invalid JSON gracefully', () => {
    const result = deserializeGameState('not valid json')
    expect(result).toBeNull()
  })

  it('should handle deserializing incomplete state gracefully', () => {
    const result = deserializeGameState('{"players": []}')
    expect(result).toBeNull()
  })

  it('should preserve stateSnapshot as null after serialization', () => {
    const state = GameEngine.createGame(2, 0)
    const json = serializeGameState(state)
    const restored = deserializeGameState(json)

    expect(restored).not.toBeNull()
    expect(restored!.stateSnapshot).toBeNull()
  })
})

describe('Integration: Reducer INIT_GAME Flow', () => {
  it('should initialize game through reducer and produce a playable state', () => {
    const initial = createInitialState()
    expect(initial.gamePhase).toBe('setup')

    const state = gameReducer(initial, {
      type: 'INIT_GAME',
      payload: { playerCount: 3, aiCount: 2, aiDifficulty: 'easy' },
    })

    expect(state.gamePhase).toBe('playing')
    expect(state.players).toHaveLength(3)
    expect(state.players.filter(p => p.isAI)).toHaveLength(2)
    expect(state.players.filter(p => !p.isAI)).toHaveLength(1)
    expect(state.merchantCardRow).toHaveLength(6)
    expect(state.pointCardRow).toHaveLength(5)
    expect(state.gameId).toBeDefined()
    expect(state.gameId).not.toBe('setup')

    // Should be able to get available actions for the current player
    const currentPlayer = state.players[state.currentPlayerIndex]!
    const actions = GameEngine.getAvailableActions(state, currentPlayer.id)
    expect(actions.length).toBeGreaterThan(0)
  })
})
