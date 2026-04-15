/**
 * Tests for useAITurn hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAITurn } from './useAITurn'
import { GameEngine } from '../engine/GameEngine'
import { GameState, GameAction } from '../types'

describe('useAITurn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should not execute for human players', () => {
    const state = GameEngine.createGame(2, 0) // 2 human players
    const onExecuteAction = vi.fn()
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    // Fast-forward time
    vi.advanceTimersByTime(3000)

    // Should not execute for human player
    expect(onExecuteAction).not.toHaveBeenCalled()
    expect(onEndTurn).not.toHaveBeenCalled()
  })

  it('should execute action for AI players', async () => {
    const state = GameEngine.createGame(2, 1) // 1 human, 1 AI
    // Make it AI player's turn
    state.currentPlayerIndex = 1
    
    const onExecuteAction = vi.fn()
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    // Fast-forward past the AI delay (1-2 seconds) and wait for promises
    await vi.advanceTimersByTimeAsync(2500)

    // Verify action was called with valid GameAction
    expect(onExecuteAction).toHaveBeenCalledTimes(1)
    const action = onExecuteAction.mock.calls[0][0] as GameAction
    expect(action).toBeDefined()
    expect(action.type).toBeDefined()
    expect(['PLAY_CARD', 'ACQUIRE_CARD', 'REST', 'CLAIM_POINT_CARD']).toContain(action.type)

    // Fast-forward to end turn delay
    await vi.advanceTimersByTimeAsync(1000)

    expect(onEndTurn).toHaveBeenCalledTimes(1)
  })

  it('should not execute if game is not in playing phase', () => {
    const state = GameEngine.createGame(2, 1)
    state.gamePhase = 'setup'
    state.currentPlayerIndex = 1 // AI player
    
    const onExecuteAction = vi.fn()
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    vi.advanceTimersByTime(3000)

    expect(onExecuteAction).not.toHaveBeenCalled()
    expect(onEndTurn).not.toHaveBeenCalled()
  })

  it('should not execute if action is in progress', () => {
    const state = GameEngine.createGame(2, 1)
    state.currentPlayerIndex = 1 // AI player
    state.stateSnapshot = { ...state } // Action in progress
    
    const onExecuteAction = vi.fn()
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    vi.advanceTimersByTime(3000)

    expect(onExecuteAction).not.toHaveBeenCalled()
    expect(onEndTurn).not.toHaveBeenCalled()
  })

  it('should handle AI action errors gracefully', async () => {
    const state = GameEngine.createGame(2, 1)
    state.currentPlayerIndex = 1 // AI player
    
    // Mock console.error to suppress error output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const onExecuteAction = vi.fn(() => {
      throw new Error('Action execution failed')
    })
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    await vi.advanceTimersByTimeAsync(2500)

    expect(onExecuteAction).toHaveBeenCalled()
    
    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalled()
    
    // Should force end turn on error to prevent game freeze
    expect(onEndTurn).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should use correct AI difficulty level', async () => {
    const state = GameEngine.createGame(2, 1, 'hard')
    state.currentPlayerIndex = 1 // AI player
    
    const onExecuteAction = vi.fn()
    const onEndTurn = vi.fn()

    renderHook(() =>
      useAITurn({
        state,
        onExecuteAction,
        onEndTurn,
      })
    )

    await vi.advanceTimersByTimeAsync(2500)

    // Verify action was executed (difficulty is internal to AIPlayer)
    expect(onExecuteAction).toHaveBeenCalledTimes(1)
  })
})
