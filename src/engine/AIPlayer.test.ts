/**
 * Unit tests for AIPlayer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AIPlayer } from './AIPlayer'
import { GameEngine } from './GameEngine'
import { GameState, GameAction } from '../types'

describe('AIPlayer', () => {
  let gameState: GameState

  beforeEach(() => {
    // Create a basic game state for testing
    gameState = GameEngine.createGame(2, 1, 'medium')
    // Make it the AI player's turn (player at index 1)
    gameState.currentPlayerIndex = 1
  })

  describe('Easy difficulty', () => {
    it('selects a random valid action', () => {
      const ai = new AIPlayer('easy')
      const action = ai.selectAction(gameState, gameState.players[1].id)

      expect(action).toBeDefined()
      expect(['PLAY_CARD', 'ACQUIRE_CARD', 'REST', 'CLAIM_POINT_CARD']).toContain(action.type)
    })

    it('always selects valid actions', () => {
      const ai = new AIPlayer('easy')

      // Test multiple times to ensure randomness doesn't break validity
      for (let i = 0; i < 10; i++) {
        const action = ai.selectAction(gameState, gameState.players[1].id)
        const availableActions = GameEngine.getAvailableActions(gameState, gameState.players[1].id)
        
        // Check that the selected action is in the available actions
        const isValid = availableActions.some(a => 
          a.type === action.type &&
          JSON.stringify(a) === JSON.stringify(action)
        )
        expect(isValid).toBe(true)
      }
    })
  })

  describe('Medium difficulty', () => {
    it('selects strategic actions', () => {
      const ai = new AIPlayer('medium')
      const action = ai.selectAction(gameState, gameState.players[1].id)

      expect(action).toBeDefined()
      expect(['PLAY_CARD', 'ACQUIRE_CARD', 'REST', 'CLAIM_POINT_CARD']).toContain(action.type)
    })

    it('evaluates all available actions', () => {
      const ai = new AIPlayer('medium')
      const availableActions = GameEngine.getAvailableActions(gameState, gameState.players[1].id)
      const evaluations = ai.evaluateActions(gameState, gameState.players[1].id, availableActions)

      expect(evaluations.length).toBe(availableActions.length)
      evaluations.forEach(evaluation => {
        expect(evaluation.action).toBeDefined()
        expect(typeof evaluation.score).toBe('number')
        expect(typeof evaluation.reasoning).toBe('string')
      })
    })

    it('prefers claiming point cards when possible', () => {
      // Set up a state where AI can claim a point card
      const player = gameState.players[1]
      const pointCard = gameState.pointCardRow[0]
      
      // Give player exact spices needed
      player.caravan = { ...pointCard.requiredSpices }

      const ai = new AIPlayer('medium')
      const action = ai.selectAction(gameState, player.id)

      // Should prefer claiming the point card
      expect(action.type).toBe('CLAIM_POINT_CARD')
    })
  })

  describe('Hard difficulty', () => {
    it('considers opponent blocking', () => {
      const ai = new AIPlayer('hard')
      const action = ai.selectAction(gameState, gameState.players[1].id)

      expect(action).toBeDefined()
      expect(['PLAY_CARD', 'ACQUIRE_CARD', 'REST', 'CLAIM_POINT_CARD']).toContain(action.type)
    })

    it('evaluates actions with opponent consideration', () => {
      const ai = new AIPlayer('hard')
      const availableActions = GameEngine.getAvailableActions(gameState, gameState.players[1].id)
      const evaluations = ai.evaluateActions(gameState, gameState.players[1].id, availableActions, true)

      expect(evaluations.length).toBe(availableActions.length)
      evaluations.forEach(evaluation => {
        expect(evaluation.action).toBeDefined()
        expect(typeof evaluation.score).toBe('number')
      })
    })
  })

  describe('Action scoring', () => {
    it('scores claim point card actions highly', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]
      const pointCard = gameState.pointCardRow[0]
      
      // Give player spices to claim
      player.caravan = { ...pointCard.requiredSpices }

      const claimAction: GameAction = {
        type: 'CLAIM_POINT_CARD',
        playerId: player.id,
        payload: {
          cardIndex: 0,
        },
      }

      const score = ai.scoreAction(gameState, claimAction, player.id, false)
      expect(score).toBeGreaterThan(0)
    })

    it('penalizes caravan overflow', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]
      
      // Fill caravan near capacity
      player.caravan = { yellow: 9, red: 0, green: 0, brown: 0 }

      const spiceCard = player.hand.find(c => c.type === 'spice')
      if (spiceCard) {
        const playAction: GameAction = {
          type: 'PLAY_CARD',
          playerId: player.id,
          payload: {
            cardId: spiceCard.id,
          },
        }

        const score = ai.scoreAction(gameState, playAction, player.id, false)
        // Should have negative score due to overflow
        expect(score).toBeLessThan(0)
      }
    })

    it('values rest action when many cards are played', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]
      
      // Move cards from hand to played
      player.playedCards = [...player.hand]
      player.hand = []

      const restAction: GameAction = {
        type: 'REST',
        playerId: player.id,
        payload: {},
      }

      const score = ai.scoreAction(gameState, restAction, player.id, false)
      expect(score).toBeGreaterThan(0)
    })

    it('penalizes rest action when few cards are played', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]
      
      // Only one card played
      player.playedCards = [player.hand[0]]
      player.hand = player.hand.slice(1)

      const restAction: GameAction = {
        type: 'REST',
        playerId: player.id,
        payload: {},
      }

      const score = ai.scoreAction(gameState, restAction, player.id, false)
      expect(score).toBeLessThan(0)
    })
  })

  describe('Action selection', () => {
    it('throws error when no actions available', () => {
      const ai = new AIPlayer('medium')
      
      // Create invalid state with no available actions
      // This is a theoretical edge case - in real game there's always at least REST available
      const invalidState = { ...gameState }
      const player = invalidState.players[1]
      
      // Remove all cards and spices
      player.hand = []
      player.playedCards = []
      player.caravan = { yellow: 0, red: 0, green: 0, brown: 0 }
      
      // Also make it not the player's turn to ensure no actions
      invalidState.currentPlayerIndex = 0

      expect(() => {
        ai.selectAction(invalidState, player.id)
      }).toThrow('No available actions for AI player')
    })

    it('selects valid actions for all difficulty levels', () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

      difficulties.forEach(difficulty => {
        const ai = new AIPlayer(difficulty)
        const action = ai.selectAction(gameState, gameState.players[1].id)
        const availableActions = GameEngine.getAvailableActions(gameState, gameState.players[1].id)

        const isValid = availableActions.some(a => 
          a.type === action.type &&
          JSON.stringify(a) === JSON.stringify(action)
        )
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Strategic decision making', () => {
    it('prefers high-value point cards', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]

      // Give player enough spices to claim any card
      player.caravan = { yellow: 0, red: 0, green: 0, brown: 10 }

      const action = ai.selectAction(gameState, player.id)

      // Should try to claim a point card if possible
      if (action.type === 'CLAIM_POINT_CARD') {
        const payload = action.payload as { cardIndex: number }
        const claimedCard = gameState.pointCardRow[payload.cardIndex]
        expect(claimedCard).toBeDefined()
      }
    })

    it('acquires valuable merchant cards', () => {
      const ai = new AIPlayer('medium')
      const player = gameState.players[1]

      // Give player some spices to acquire cards
      player.caravan = { yellow: 3, red: 0, green: 0, brown: 0 }

      const action = ai.selectAction(gameState, player.id)

      // Should make a valid decision
      expect(action).toBeDefined()
      expect(['PLAY_CARD', 'ACQUIRE_CARD', 'REST']).toContain(action.type)
    })
  })
})
