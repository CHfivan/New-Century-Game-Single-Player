/**
 * Property-based tests for AIPlayer
 * Feature: century-spice-road-game
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { AIPlayer } from './AIPlayer'
import { GameEngine } from './GameEngine'
import { GameState } from '../types'

/**
 * Arbitrary for generating game states with AI players
 */
const gameStateWithAIArb = fc.integer({ min: 2, max: 5 }).chain((playerCount) => {
  return fc.integer({ min: 1, max: playerCount - 1 }).chain((aiCount) => {
    return fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const).map((difficulty) => {
      const state = GameEngine.createGame(playerCount, aiCount, difficulty)
      // Find an AI player index (skip player 0 which is human)
      const aiPlayerIndex = state.players.findIndex((p, idx) => idx > 0 && p.isAI)
      return {
        state,
        aiPlayerIndex: aiPlayerIndex !== -1 ? aiPlayerIndex : 1,
      }
    })
  })
})

describe('AIPlayer Property Tests', () => {
  /**
   * Property 19: AI Actions Are Valid
   * Validates: Requirements 6.3
   * 
   * For any game state where it is an AI player's turn, any action chosen by the AI
   * should pass validation (AI never attempts invalid actions)
   */
  it('Property 19: AI Actions Are Valid', () => {
    fc.assert(
      fc.property(gameStateWithAIArb, ({ state, aiPlayerIndex }) => {
        // Make it the AI player's turn
        state.currentPlayerIndex = aiPlayerIndex
        const aiPlayer = state.players[aiPlayerIndex]
        
        // Skip if not an AI player (edge case)
        if (!aiPlayer || !aiPlayer.isAI) {
          return true
        }

        // Create AI instance with the player's difficulty
        const ai = new AIPlayer(aiPlayer.aiDifficulty || 'medium')
        
        // Select an action
        const action = ai.selectAction(state, aiPlayer.id)
        
        // Validate the action
        const validation = GameEngine.validateAction(state, action)
        
        // The action must be valid
        return validation.valid === true
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Additional property: AI actions are executable
   * Ensures that valid AI actions can actually be executed without errors
   */
  it('Property: AI Actions Are Executable', () => {
    fc.assert(
      fc.property(gameStateWithAIArb, ({ state, aiPlayerIndex }) => {
        // Make it the AI player's turn
        state.currentPlayerIndex = aiPlayerIndex
        const aiPlayer = state.players[aiPlayerIndex]
        
        // Skip if not an AI player
        if (!aiPlayer || !aiPlayer.isAI) {
          return true
        }

        // Create AI instance
        const ai = new AIPlayer(aiPlayer.aiDifficulty || 'medium')
        
        // Select an action
        const action = ai.selectAction(state, aiPlayer.id)
        
        // Try to execute the action - should not throw
        try {
          const newState = GameEngine.executeAction(state, action)
          // Execution succeeded, verify state changed
          return newState !== state
        } catch (error) {
          // Execution failed - this should never happen
          console.error('AI action execution failed:', error)
          return false
        }
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: AI respects turn order
   * Ensures AI only selects actions for the current player
   */
  it('Property: AI Respects Turn Order', () => {
    fc.assert(
      fc.property(gameStateWithAIArb, ({ state, aiPlayerIndex }) => {
        // Make it the AI player's turn
        state.currentPlayerIndex = aiPlayerIndex
        const aiPlayer = state.players[aiPlayerIndex]
        
        // Skip if not an AI player
        if (!aiPlayer || !aiPlayer.isAI) {
          return true
        }

        // Create AI instance
        const ai = new AIPlayer(aiPlayer.aiDifficulty || 'medium')
        
        // Select an action
        const action = ai.selectAction(state, aiPlayer.id)
        
        // The action's playerId must match the AI player's ID
        return action.playerId === aiPlayer.id
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: AI actions are deterministic for same state
   * For medium and hard difficulty, same state should produce same action
   * (Easy difficulty is random, so we skip it)
   */
  it('Property: AI Actions Are Consistent', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerCount: fc.constant(2),
          difficulty: fc.constantFrom('medium' as const, 'hard' as const),
        }),
        ({ playerCount, difficulty }) => {
          // Create a game state
          const state = GameEngine.createGame(playerCount, 1, difficulty)
          state.currentPlayerIndex = 1 // AI player
          const aiPlayer = state.players[1]
          
          if (!aiPlayer || !aiPlayer.isAI) {
            return true
          }

          // Create AI instance
          const ai = new AIPlayer(difficulty)
          
          // Select action twice with same state
          const action1 = ai.selectAction(state, aiPlayer.id)
          const action2 = ai.selectAction(state, aiPlayer.id)
          
          // Actions should be identical (same type and payload)
          return (
            action1.type === action2.type &&
            JSON.stringify(action1.payload) === JSON.stringify(action2.payload)
          )
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    )
  })

  /**
   * Property: AI never selects REST when no cards are played
   * Validates that AI follows game rules about REST action
   */
  it('Property: AI REST Action Follows Rules', () => {
    fc.assert(
      fc.property(gameStateWithAIArb, ({ state, aiPlayerIndex }) => {
        // Make it the AI player's turn
        state.currentPlayerIndex = aiPlayerIndex
        const aiPlayer = state.players[aiPlayerIndex]
        
        // Skip if not an AI player
        if (!aiPlayer || !aiPlayer.isAI) {
          return true
        }

        // Ensure no played cards
        aiPlayer.playedCards = []
        
        // Create AI instance
        const ai = new AIPlayer(aiPlayer.aiDifficulty || 'medium')
        
        // Select an action
        const action = ai.selectAction(state, aiPlayer.id)
        
        // Action should never be REST when no cards are played
        return action.type !== 'REST'
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })
})
