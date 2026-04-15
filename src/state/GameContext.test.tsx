/**
 * Unit tests for GameContext
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { GameProvider, useGame, loadSavedGame, clearSavedGame, serializeGameState, deserializeGameState } from './GameContext'
import { GameEngine } from '../engine/GameEngine'
import React from 'react'

describe('GameContext', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    // Replace global localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('GameProvider', () => {
    it('should provide initial setup state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.state.gamePhase).toBe('setup')
      expect(result.current.state.players).toEqual([])
      expect(result.current.currentPlayer).toBeNull()
      expect(result.current.isHumanTurn).toBe(false)
      expect(result.current.actionInProgress).toBe(false)
    })

    it('should provide game state from initialState prop', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.state.gamePhase).toBe('playing')
      expect(result.current.state.players).toHaveLength(2)
    })

    it('should calculate currentPlayer correctly', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.currentPlayer).not.toBeNull()
      expect(result.current.currentPlayer?.id).toBe(initialState.players[0]?.id)
    })

    it('should calculate isHumanTurn correctly for human player', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.isHumanTurn).toBe(true)
    })

    it('should calculate isHumanTurn correctly for AI player', () => {
      const initialState = GameEngine.createGame(2, 1)
      // Make sure current player is AI
      initialState.currentPlayerIndex = initialState.players.findIndex(p => p.isAI)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.isHumanTurn).toBe(false)
    })

    it('should calculate actionInProgress based on stateSnapshot', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      expect(result.current.actionInProgress).toBe(false)

      // Begin an action
      act(() => {
        result.current.dispatch({
          type: 'BEGIN_ACTION',
          payload: { actionType: 'PLAY_CARD' },
        })
      })

      expect(result.current.actionInProgress).toBe(true)
    })

    it('should auto-save to localStorage on state change', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      // Dispatch an action
      act(() => {
        result.current.dispatch({ type: 'END_TURN' })
      })

      // Check that state was saved
      const saved = localStorage.getItem('century-spice-road-save')
      expect(saved).not.toBeNull()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.currentPlayerIndex).toBe(1)
    })

    it('should strip stateSnapshot when auto-saving', () => {
      const initialState = GameEngine.createGame(2, 0)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      // Begin an action to create a snapshot
      act(() => {
        result.current.dispatch({
          type: 'BEGIN_ACTION',
          payload: { actionType: 'PLAY_CARD' },
        })
      })

      // Check that saved state has stateSnapshot as null
      const saved = localStorage.getItem('century-spice-road-save')
      expect(saved).not.toBeNull()
      const parsed = JSON.parse(saved!)
      expect(parsed.stateSnapshot).toBeNull()
    })

    it('should clear saved state when game ends', () => {
      const initialState = GameEngine.createGame(3, 0)
      // Give first player enough point cards to trigger game over
      initialState.players[0]!.pointCards = Array(5).fill(null).map((_, i) => ({
        id: `point_${i}`,
        points: 10,
        requiredSpices: { yellow: 0, red: 0, green: 0, brown: 0 },
        imageUrl: '',
      }))

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      // First verify there's a save (initial state is 'playing')
      const savedBefore = localStorage.getItem('century-spice-road-save')
      expect(savedBefore).not.toBeNull()

      // End turn to trigger game over
      act(() => {
        result.current.dispatch({ type: 'END_TURN' })
      })

      // Save should be cleared when game ends
      const savedAfter = localStorage.getItem('century-spice-road-save')
      expect(savedAfter).toBeNull()
    })

    it('should serialize cardUsageCount Map as array entries', () => {
      const initialState = GameEngine.createGame(2, 0)
      // Add some card usage data
      initialState.players[0]!.statistics.cardUsageCount.set('card_1', 3)
      initialState.players[0]!.statistics.cardUsageCount.set('card_2', 1)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider initialState={initialState}>{children}</GameProvider>
      )

      renderHook(() => useGame(), { wrapper })

      const saved = localStorage.getItem('century-spice-road-save')
      expect(saved).not.toBeNull()
      const parsed = JSON.parse(saved!)
      
      // cardUsageCount should be serialized as array of entries
      const cardUsage = parsed.players[0].statistics.cardUsageCount
      expect(Array.isArray(cardUsage)).toBe(true)
      expect(cardUsage).toContainEqual(['card_1', 3])
      expect(cardUsage).toContainEqual(['card_2', 1])
    })

    it('should not save setup state to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider>{children}</GameProvider>
      )

      renderHook(() => useGame(), { wrapper })

      // Setup state should not be saved
      const saved = localStorage.getItem('century-spice-road-save')
      expect(saved).toBeNull()
    })
  })

  describe('useGame hook', () => {
    it('should throw error when used outside GameProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useGame())
      }).toThrow('useGame must be used within a GameProvider')

      consoleSpy.mockRestore()
    })

    it('should allow dispatching actions', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GameProvider>{children}</GameProvider>
      )

      const { result } = renderHook(() => useGame(), { wrapper })

      act(() => {
        result.current.dispatch({
          type: 'INIT_GAME',
          payload: {
            playerCount: 2,
            aiCount: 0,
          },
        })
      })

      expect(result.current.state.players).toHaveLength(2)
    })
  })

  describe('loadSavedGame', () => {
    it('should load saved game from localStorage', () => {
      const gameState = GameEngine.createGame(2, 0)
      const serialized = serializeGameState(gameState)
      localStorage.setItem('century-spice-road-save', serialized)

      const loaded = loadSavedGame()

      expect(loaded).not.toBeNull()
      expect(loaded?.players).toHaveLength(2)
    })

    it('should restore cardUsageCount as Map when loading', () => {
      const gameState = GameEngine.createGame(2, 0)
      gameState.players[0]!.statistics.cardUsageCount.set('test_card', 7)
      const serialized = serializeGameState(gameState)
      localStorage.setItem('century-spice-road-save', serialized)

      const loaded = loadSavedGame()

      expect(loaded).not.toBeNull()
      expect(loaded!.players[0]!.statistics.cardUsageCount).toBeInstanceOf(Map)
      expect(loaded!.players[0]!.statistics.cardUsageCount.get('test_card')).toBe(7)
    })

    it('should return null if no save exists', () => {
      const loaded = loadSavedGame()

      expect(loaded).toBeNull()
    })

    it('should return null and clear storage if save data is corrupted JSON', () => {
      localStorage.setItem('century-spice-road-save', 'invalid json')

      const loaded = loadSavedGame()

      expect(loaded).toBeNull()
      // Should also clear the corrupted data
      expect(localStorage.getItem('century-spice-road-save')).toBeNull()
    })

    it('should return null and clear storage if save data is missing players', () => {
      localStorage.setItem('century-spice-road-save', JSON.stringify({ invalid: 'data' }))

      const loaded = loadSavedGame()

      expect(loaded).toBeNull()
      expect(localStorage.getItem('century-spice-road-save')).toBeNull()
    })

    it('should return null and clear storage if save data fails validation', () => {
      localStorage.setItem('century-spice-road-save', JSON.stringify({
        players: [{ id: 'p1' }], // incomplete player data
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        merchantCardRow: [],
        pointCardRow: [],
        turnNumber: 1,
      }))

      const loaded = loadSavedGame()

      expect(loaded).toBeNull()
      expect(localStorage.getItem('century-spice-road-save')).toBeNull()
    })
  })

  describe('clearSavedGame', () => {
    it('should remove saved game from localStorage', () => {
      const gameState = GameEngine.createGame(2, 0)
      localStorage.setItem('century-spice-road-save', JSON.stringify(gameState))

      clearSavedGame()

      const saved = localStorage.getItem('century-spice-road-save')
      expect(saved).toBeNull()
    })

    it('should not throw if no save exists', () => {
      expect(() => clearSavedGame()).not.toThrow()
    })
  })

  describe('serializeGameState', () => {
    it('should strip stateSnapshot from serialized output', () => {
      const gameState = GameEngine.createGame(2, 0)
      gameState.stateSnapshot = { ...gameState, stateSnapshot: null }

      const serialized = serializeGameState(gameState)
      const parsed = JSON.parse(serialized)

      expect(parsed.stateSnapshot).toBeNull()
    })

    it('should convert cardUsageCount Map to array entries', () => {
      const gameState = GameEngine.createGame(2, 0)
      gameState.players[0]!.statistics.cardUsageCount.set('card_a', 5)
      gameState.players[0]!.statistics.cardUsageCount.set('card_b', 2)

      const serialized = serializeGameState(gameState)
      const parsed = JSON.parse(serialized)

      const cardUsage = parsed.players[0].statistics.cardUsageCount
      expect(Array.isArray(cardUsage)).toBe(true)
      expect(cardUsage).toContainEqual(['card_a', 5])
      expect(cardUsage).toContainEqual(['card_b', 2])
    })

    it('should produce valid JSON', () => {
      const gameState = GameEngine.createGame(3, 2)
      const serialized = serializeGameState(gameState)

      expect(() => JSON.parse(serialized)).not.toThrow()
    })
  })

  describe('deserializeGameState', () => {
    it('should restore a valid game state', () => {
      const gameState = GameEngine.createGame(2, 0)
      gameState.players[0]!.statistics.cardUsageCount.set('card_x', 3)

      const serialized = serializeGameState(gameState)
      const restored = deserializeGameState(serialized)

      expect(restored).not.toBeNull()
      expect(restored!.players).toHaveLength(2)
      expect(restored!.gamePhase).toBe('playing')
      expect(restored!.stateSnapshot).toBeNull()
    })

    it('should restore cardUsageCount as a Map', () => {
      const gameState = GameEngine.createGame(2, 0)
      gameState.players[0]!.statistics.cardUsageCount.set('card_x', 3)

      const serialized = serializeGameState(gameState)
      const restored = deserializeGameState(serialized)

      expect(restored).not.toBeNull()
      const cardUsage = restored!.players[0]!.statistics.cardUsageCount
      expect(cardUsage).toBeInstanceOf(Map)
      expect(cardUsage.get('card_x')).toBe(3)
    })

    it('should return null for invalid JSON', () => {
      expect(deserializeGameState('not json')).toBeNull()
    })

    it('should return null for missing players array', () => {
      const result = deserializeGameState(JSON.stringify({ gamePhase: 'playing' }))
      expect(result).toBeNull()
    })

    it('should return null for empty players array', () => {
      const result = deserializeGameState(JSON.stringify({
        players: [],
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        merchantCardRow: [],
        pointCardRow: [],
        turnNumber: 1,
      }))
      expect(result).toBeNull()
    })

    it('should return null for invalid gamePhase', () => {
      const gameState = GameEngine.createGame(2, 0)
      const serialized = serializeGameState(gameState)
      const parsed = JSON.parse(serialized)
      parsed.gamePhase = 'invalid'

      const result = deserializeGameState(JSON.stringify(parsed))
      expect(result).toBeNull()
    })

    it('should return null for missing player fields', () => {
      const result = deserializeGameState(JSON.stringify({
        players: [{ id: 'p1' }], // missing name, caravan, hand, statistics
        gamePhase: 'playing',
        currentPlayerIndex: 0,
        merchantCardRow: [],
        pointCardRow: [],
        turnNumber: 1,
      }))
      expect(result).toBeNull()
    })

    it('should handle cardUsageCount that is neither array nor Map', () => {
      const gameState = GameEngine.createGame(2, 0)
      const serialized = serializeGameState(gameState)
      const parsed = JSON.parse(serialized)
      // Corrupt the cardUsageCount to be an object
      parsed.players[0].statistics.cardUsageCount = { broken: true }

      const result = deserializeGameState(JSON.stringify(parsed))
      expect(result).not.toBeNull()
      expect(result!.players[0]!.statistics.cardUsageCount).toBeInstanceOf(Map)
      expect(result!.players[0]!.statistics.cardUsageCount.size).toBe(0)
    })

    it('should always set stateSnapshot to null', () => {
      const gameState = GameEngine.createGame(2, 0)
      const serialized = serializeGameState(gameState)
      const parsed = JSON.parse(serialized)
      parsed.stateSnapshot = { fake: 'snapshot' }

      const result = deserializeGameState(JSON.stringify(parsed))
      expect(result).not.toBeNull()
      expect(result!.stateSnapshot).toBeNull()
    })
  })
})
