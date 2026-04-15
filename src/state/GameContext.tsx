/**
 * React Context for game state management
 * Provides game state and dispatch function to all components
 */

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react'
import { GameState, GameAction } from '../types/game'
import { GameContextValue } from '../types/state'
import { gameReducer, createInitialState } from './gameReducer'
import { useAITurn } from './useAITurn'

// Create the context with undefined default (will be provided by GameProvider)
const GameContext = createContext<GameContextValue | undefined>(undefined)

/**
 * Props for GameProvider component
 */
interface GameProviderProps {
  children: React.ReactNode
  initialState?: GameState
  onAIAction?: (action: GameAction, state: GameState) => void
}

/**
 * GameProvider component that wraps the app and provides game state
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children, initialState, onAIAction }) => {
  // Initialize state from props or create new initial state
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState || createInitialState()
  )

  // Auto-save to local storage on every state change
  // Clear saved state when game ends (Requirement 13.3)
  useEffect(() => {
    if (state.gamePhase === 'setup') {
      return
    }
    if (state.gamePhase === 'ended') {
      clearSavedGame()
      return
    }
    try {
      const stateToSave = serializeGameState(state)
      localStorage.setItem('century-spice-road-save', stateToSave)
    } catch (error) {
      console.error('Failed to save game state:', error)
    }
  }, [state])

  // Calculate derived values
  const currentPlayer = useMemo(() => {
    if (state.gamePhase === 'setup' || state.gamePhase === 'ended') {
      return null
    }
    return state.players[state.currentPlayerIndex] || null
  }, [state.players, state.currentPlayerIndex, state.gamePhase])

  const isHumanTurn = useMemo(() => {
    return currentPlayer !== null && !currentPlayer.isAI
  }, [currentPlayer])

  const actionInProgress = useMemo(() => {
    return state.stateSnapshot !== null
  }, [state.stateSnapshot])

  // Callbacks for AI turn execution
  const handleExecuteAction = useCallback((action: GameAction) => {
    dispatch({ type: 'EXECUTE_GAME_ACTION', payload: action })
  }, [])

  const handleEndTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' })
  }, [])

  // Integrate AI turn execution
  useAITurn({
    state,
    onExecuteAction: handleExecuteAction,
    onEndTurn: handleEndTurn,
    onAIAction,
  })

  // Create context value
  const value: GameContextValue = {
    state,
    dispatch,
    currentPlayer,
    isHumanTurn,
    actionInProgress,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

/**
 * Hook to access game context
 * Throws error if used outside GameProvider
 */
export const useGame = (): GameContextValue => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

/**
 * Serialize a GameState for localStorage storage.
 * Strips stateSnapshot (contains circular references) and converts
 * Map fields (cardUsageCount) to JSON-safe arrays.
 */
export const serializeGameState = (state: GameState): string => {
  const stateToSave = {
    ...state,
    stateSnapshot: null, // Never persist the snapshot
    players: state.players.map(player => ({
      ...player,
      statistics: {
        ...player.statistics,
        // Convert Map to array of entries for JSON serialization
        cardUsageCount: Array.from(player.statistics.cardUsageCount.entries()),
      },
    })),
  }
  return JSON.stringify(stateToSave)
}

/**
 * Deserialize a saved game state string back into a GameState.
 * Restores Map fields from serialized arrays.
 * Returns null if the data is invalid or corrupted.
 */
export const deserializeGameState = (json: string): GameState | null => {
  let parsed: any
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }

  // Validate required top-level fields
  if (!parsed || typeof parsed !== 'object') return null
  if (!Array.isArray(parsed.players) || parsed.players.length === 0) return null
  if (!parsed.gamePhase || !['setup', 'playing', 'ended'].includes(parsed.gamePhase)) return null
  if (typeof parsed.currentPlayerIndex !== 'number') return null
  if (!Array.isArray(parsed.merchantCardRow)) return null
  if (!Array.isArray(parsed.pointCardRow)) return null
  if (typeof parsed.turnNumber !== 'number') return null

  // Validate and restore each player
  for (const player of parsed.players) {
    if (!player.id || !player.name || !player.caravan) return null
    if (!Array.isArray(player.hand)) return null
    if (!player.statistics) return null

    // Restore cardUsageCount Map from serialized entries
    const rawCount = player.statistics.cardUsageCount
    if (Array.isArray(rawCount)) {
      player.statistics.cardUsageCount = new Map(rawCount)
    } else if (!(rawCount instanceof Map)) {
      // If it's neither an array nor a Map, create an empty Map
      player.statistics.cardUsageCount = new Map()
    }
  }

  // Ensure stateSnapshot is null (never restore a snapshot from save)
  parsed.stateSnapshot = null

  return parsed as GameState
}

/**
 * Load saved game from local storage
 * Returns null if no save exists or if save is corrupted
 * Requirements: 13.2, 13.4
 */
export const loadSavedGame = (): GameState | null => {
  try {
    const saved = localStorage.getItem('century-spice-road-save')
    if (!saved) {
      return null
    }

    const state = deserializeGameState(saved)
    if (!state) {
      console.error('Invalid save data: failed validation')
      clearSavedGame()
      return null
    }

    return state
  } catch (error) {
    console.error('Failed to load saved game:', error)
    clearSavedGame()
    return null
  }
}

/**
 * Clear saved game from local storage
 * Requirements: 13.3
 */
export const clearSavedGame = (): void => {
  try {
    localStorage.removeItem('century-spice-road-save')
  } catch (error) {
    console.error('Failed to clear saved game:', error)
  }
}
