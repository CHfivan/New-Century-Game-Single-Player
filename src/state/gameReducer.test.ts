/**
 * Unit tests for game reducer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { gameReducer, createInitialState } from './gameReducer'
import { GameState } from '../types/game'
import { GameEngine } from '../engine/GameEngine'

describe('gameReducer', () => {
  let initialState: GameState

  beforeEach(() => {
    initialState = createInitialState()
  })

  describe('createInitialState', () => {
    it('should create a valid setup state', () => {
      const state = createInitialState()
      
      expect(state.gamePhase).toBe('setup')
      expect(state.players).toEqual([])
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.turnNumber).toBe(0)
      expect(state.winner).toBeNull()
      expect(state.stateSnapshot).toBeNull()
    })
  })

  describe('INIT_GAME action', () => {
    it('should initialize a new game with 2 players', () => {
      const action = {
        type: 'INIT_GAME' as const,
        payload: {
          playerCount: 2,
          aiCount: 0,
        },
      }

      const newState = gameReducer(initialState, action)

      expect(newState.players).toHaveLength(2)
      expect(newState.gamePhase).toBe('playing')
      expect(newState.merchantCardRow).toHaveLength(6)
      expect(newState.pointCardRow).toHaveLength(5)
      expect(newState.turnNumber).toBe(1)
    })

    it('should initialize a game with AI players', () => {
      const action = {
        type: 'INIT_GAME' as const,
        payload: {
          playerCount: 3,
          aiCount: 2,
          aiDifficulty: 'medium' as const,
        },
      }

      const newState = gameReducer(initialState, action)

      expect(newState.players).toHaveLength(3)
      const aiPlayers = newState.players.filter(p => p.isAI)
      const humanPlayers = newState.players.filter(p => !p.isAI)
      
      expect(aiPlayers).toHaveLength(2)
      expect(humanPlayers).toHaveLength(1)
    })

    it('should use default AI difficulty if not specified', () => {
      const action = {
        type: 'INIT_GAME' as const,
        payload: {
          playerCount: 2,
          aiCount: 1,
        },
      }

      const newState = gameReducer(initialState, action)

      const aiPlayer = newState.players.find(p => p.isAI)
      expect(aiPlayer?.aiDifficulty).toBe('medium')
    })
  })

  describe('EXECUTE_GAME_ACTION action', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = GameEngine.createGame(2, 0)
    })

    it('should execute a valid play card action', () => {
      const player = gameState.players[0]!
      const spiceCard = player.hand.find(c => c.type === 'spice')
      
      if (!spiceCard) {
        throw new Error('No spice card found in hand')
      }

      const action = {
        type: 'EXECUTE_GAME_ACTION' as const,
        payload: {
          type: 'PLAY_CARD' as const,
          playerId: player.id,
          payload: {
            cardId: spiceCard.id,
          },
        },
      }

      const newState = gameReducer(gameState, action)

      // Card should be moved from hand to played cards
      const newPlayer = newState.players[0]!
      expect(newPlayer.hand.length).toBe(player.hand.length - 1)
      expect(newPlayer.playedCards.length).toBe(1)
    })

    it('should return unchanged state on invalid action', () => {
      const action = {
        type: 'EXECUTE_GAME_ACTION' as const,
        payload: {
          type: 'PLAY_CARD' as const,
          playerId: 'invalid_player',
          payload: {
            cardId: 'invalid_card',
          },
        },
      }

      const newState = gameReducer(gameState, action)

      // State should be unchanged
      expect(newState).toEqual(gameState)
    })
  })

  describe('END_TURN action', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = GameEngine.createGame(3, 0)
    })

    it('should advance to next player', () => {
      const action = { type: 'END_TURN' as const }

      const newState = gameReducer(gameState, action)

      expect(newState.currentPlayerIndex).toBe(1)
      expect(newState.turnNumber).toBe(1) // Same turn, different player
    })

    it('should wrap around to first player and increment turn', () => {
      // Advance to last player
      let state = gameState
      state = gameReducer(state, { type: 'END_TURN' as const })
      state = gameReducer(state, { type: 'END_TURN' as const })
      
      expect(state.currentPlayerIndex).toBe(2)

      // End turn should wrap to player 0 and increment turn
      const newState = gameReducer(state, { type: 'END_TURN' as const })

      expect(newState.currentPlayerIndex).toBe(0)
      expect(newState.turnNumber).toBe(2)
    })

    it('should detect game over and set winner', () => {
      // Give first player enough point cards to win
      const player = gameState.players[0]!
      player.pointCards = Array(5).fill(null).map((_, i) => ({
        id: `point_${i}`,
        points: 10,
        requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
        imageUrl: '',
      }))

      const action = { type: 'END_TURN' as const }
      const newState = gameReducer(gameState, action)

      expect(newState.gamePhase).toBe('ended')
      expect(newState.winner).not.toBeNull()
    })
  })

  describe('LOAD_GAME action', () => {
    it('should load a saved game state', () => {
      const savedState = GameEngine.createGame(2, 0)
      
      const action = {
        type: 'LOAD_GAME' as const,
        payload: savedState,
      }

      const newState = gameReducer(initialState, action)

      expect(newState).toEqual(savedState)
    })
  })

  describe('SAVE_GAME action', () => {
    it('should return unchanged state (save handled by useEffect)', () => {
      const gameState = GameEngine.createGame(2, 0)
      
      const action = { type: 'SAVE_GAME' as const }
      const newState = gameReducer(gameState, action)

      expect(newState).toEqual(gameState)
    })
  })

  describe('BEGIN_ACTION action', () => {
    it('should create a state snapshot', () => {
      const gameState = GameEngine.createGame(2, 0)
      
      const action = {
        type: 'BEGIN_ACTION' as const,
        payload: {
          actionType: 'PLAY_CARD',
        },
      }

      const newState = gameReducer(gameState, action)

      expect(newState.stateSnapshot).not.toBeNull()
      expect(newState.stateSnapshot?.players).toEqual(gameState.players)
    })

    it('should not include nested snapshot in snapshot', () => {
      const gameState = GameEngine.createGame(2, 0)
      
      const action = {
        type: 'BEGIN_ACTION' as const,
        payload: {
          actionType: 'PLAY_CARD',
        },
      }

      const newState = gameReducer(gameState, action)

      expect(newState.stateSnapshot?.stateSnapshot).toBeNull()
    })
  })

  describe('CANCEL_ACTION action', () => {
    it('should restore state from snapshot', () => {
      const gameState = GameEngine.createGame(2, 0)
      
      // Create snapshot
      const stateWithSnapshot = gameReducer(gameState, {
        type: 'BEGIN_ACTION' as const,
        payload: { actionType: 'PLAY_CARD' },
      })

      // Modify state (simulate partial action)
      const modifiedState = {
        ...stateWithSnapshot,
        currentPlayerIndex: 1,
      }

      // Cancel should restore original state
      const restoredState = gameReducer(modifiedState, {
        type: 'CANCEL_ACTION' as const,
      })

      expect(restoredState.currentPlayerIndex).toBe(0)
      expect(restoredState.stateSnapshot).toBeNull()
    })

    it('should return unchanged state if no snapshot exists', () => {
      const gameState = GameEngine.createGame(2, 0)
      
      const action = { type: 'CANCEL_ACTION' as const }
      const newState = gameReducer(gameState, action)

      expect(newState).toEqual(gameState)
    })
  })

  describe('COMMIT_ACTION action', () => {
    it('should execute action and clear snapshot', () => {
      const gameState = GameEngine.createGame(2, 0)
      const player = gameState.players[0]!
      const spiceCard = player.hand.find(c => c.type === 'spice')!

      // Create snapshot
      const stateWithSnapshot = gameReducer(gameState, {
        type: 'BEGIN_ACTION' as const,
        payload: { actionType: 'PLAY_CARD' },
      })

      // Commit action
      const action = {
        type: 'COMMIT_ACTION' as const,
        payload: {
          type: 'PLAY_CARD' as const,
          playerId: player.id,
          payload: {
            cardId: spiceCard.id,
          },
        },
      }

      const newState = gameReducer(stateWithSnapshot, action)

      // Action should be executed
      const newPlayer = newState.players[0]!
      expect(newPlayer.playedCards.length).toBe(1)
      
      // Snapshot should be cleared
      expect(newState.stateSnapshot).toBeNull()
    })

    it('should restore from snapshot on commit error', () => {
      const gameState = GameEngine.createGame(2, 0)

      // Create snapshot
      const stateWithSnapshot = gameReducer(gameState, {
        type: 'BEGIN_ACTION' as const,
        payload: { actionType: 'PLAY_CARD' },
      })

      // Try to commit invalid action
      const action = {
        type: 'COMMIT_ACTION' as const,
        payload: {
          type: 'PLAY_CARD' as const,
          playerId: 'invalid_player',
          payload: {
            cardId: 'invalid_card',
          },
        },
      }

      const newState = gameReducer(stateWithSnapshot, action)

      // Should restore from snapshot
      expect(newState.currentPlayerIndex).toBe(gameState.currentPlayerIndex)
      expect(newState.stateSnapshot).toBeNull()
    })
  })
})
