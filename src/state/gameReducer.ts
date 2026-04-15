/**
 * Game state reducer
 * Handles all state transitions for the game
 */

import { GameState } from '../types/game'
import { StateAction } from '../types/state'
import { GameEngine } from '../engine/GameEngine'

/**
 * Create initial game state (setup phase)
 */
export const createInitialState = (): GameState => {
  // Return a minimal setup state
  return {
    gameId: 'setup',
    players: [],
    currentPlayerIndex: 0,
    merchantCardRow: [],
    merchantCardSpices: [],
    merchantDeck: [],
    pointCardRow: [],
    pointDeck: [],
    goldCoins: 0,
    silverCoins: 0,
    coinPositions: {
      gold: false,
      silver: false,
    },
    gamePhase: 'setup',
    winner: null,
    turnNumber: 0,
    stateSnapshot: null,
  }
}

/**
 * Game reducer function
 * Processes state actions and returns new state
 */
export const gameReducer = (state: GameState, action: StateAction): GameState => {
  switch (action.type) {
    case 'INIT_GAME': {
      // Initialize a new game with the specified settings
      const { playerCount, aiCount, aiDifficulty } = action.payload
      const newState = GameEngine.createGame(
        playerCount,
        aiCount || 0,
        aiDifficulty || 'medium'
      )
      return newState
    }

    case 'EXECUTE_GAME_ACTION': {
      // Execute a game action (play card, acquire, rest, claim point card)
      try {
        const newState = GameEngine.executeAction(state, action.payload)
        return newState
      } catch (error) {
        console.error('Failed to execute game action:', error)
        return state // Return unchanged state on error
      }
    }

    case 'END_TURN': {
      // Advance to next player
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
      
      // Check if we completed a full round
      const isNewRound = nextPlayerIndex === 0
      
      // Check if game is over
      const isGameOver = GameEngine.isGameOver(state)
      
      if (isGameOver) {
        // Calculate final scores and determine winner
        const sortedPlayers = GameEngine.calculateFinalScores(state)
        const winnerPlayer = sortedPlayers[0]
        
        // Find winner's index in original players array
        const winnerIndex = winnerPlayer 
          ? state.players.findIndex(p => p.id === winnerPlayer.id)
          : null
        
        return {
          ...state,
          gamePhase: 'ended',
          winner: winnerIndex !== -1 ? winnerIndex : null,
          currentPlayerIndex: nextPlayerIndex,
          turnNumber: isNewRound ? state.turnNumber + 1 : state.turnNumber,
          stateSnapshot: null, // Always clear snapshot on turn end
        }
      }
      
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: isNewRound ? state.turnNumber + 1 : state.turnNumber,
        stateSnapshot: null, // Always clear snapshot on turn end
      }
    }

    case 'LOAD_GAME': {
      // Load a saved game state
      return action.payload
    }

    case 'SAVE_GAME': {
      // Save is handled by useEffect in GameContext
      // This action is a no-op but can be used to trigger side effects
      return state
    }

    case 'BEGIN_ACTION': {
      // Create a snapshot of current state for potential cancellation
      return {
        ...state,
        stateSnapshot: { ...state, stateSnapshot: null }, // Deep copy without nested snapshot
      }
    }

    case 'CANCEL_ACTION': {
      // Restore state from snapshot
      if (state.stateSnapshot === null) {
        console.warn('CANCEL_ACTION called but no snapshot exists')
        return state
      }
      
      return {
        ...state.stateSnapshot,
        stateSnapshot: null, // Clear the snapshot
      }
    }

    case 'COMMIT_ACTION': {
      // Execute the action and clear the snapshot
      try {
        const newState = GameEngine.executeAction(state, action.payload)
        return {
          ...newState,
          stateSnapshot: null, // Clear the snapshot
        }
      } catch (error) {
        console.error('Failed to commit action:', error)
        // On error, restore from snapshot if available
        if (state.stateSnapshot) {
          return {
            ...state.stateSnapshot,
            stateSnapshot: null,
          }
        }
        return {
          ...state,
          stateSnapshot: null,
        }
      }
    }

    default:
      return state
  }
}
