/**
 * Hook for handling AI turn execution
 * Automatically executes AI actions when it's an AI player's turn
 */

import { useEffect, useRef } from 'react'
import { GameState } from '../types/game'
import { AIPlayer } from '../engine/AIPlayer'
import { GameAction } from '../types/game'

interface UseAITurnProps {
  state: GameState
  onExecuteAction: (action: GameAction) => void
  onEndTurn: () => void
  onAIAction?: (action: GameAction, state: GameState) => void
}

/**
 * Hook that handles AI turn execution
 * Detects when it's an AI player's turn and executes their action.
 *
 * Key design: the effect depends ONLY on the three values that indicate
 * "whose turn is it and can we act?" — currentPlayerIndex, gamePhase,
 * and stateSnapshot.  We deliberately exclude `state` itself so that
 * the AI's own EXECUTE_GAME_ACTION (which mutates state but not those
 * three keys) does NOT re-trigger the effect and cancel the pending
 * END_TURN timeout.
 *
 * We read the latest state via a ref so the timeout closure always
 * sees fresh data.
 */
export const useAITurn = ({ state, onExecuteAction, onEndTurn, onAIAction }: UseAITurnProps): void => {
  const aiPlayerRef = useRef<AIPlayer | null>(null)
  const timeoutIdsRef = useRef<number[]>([])

  // Keep a ref to the latest state so timeout closures read fresh data
  const stateRef = useRef(state)
  stateRef.current = state

  // Keep stable refs for callbacks
  const onExecuteActionRef = useRef(onExecuteAction)
  const onEndTurnRef = useRef(onEndTurn)
  const onAIActionRef = useRef(onAIAction)
  onExecuteActionRef.current = onExecuteAction
  onEndTurnRef.current = onEndTurn
  onAIActionRef.current = onAIAction

  const clearAllTimeouts = () => {
    for (const id of timeoutIdsRef.current) {
      clearTimeout(id)
    }
    timeoutIdsRef.current = []
  }

  useEffect(() => {
    // Don't execute if game is not in playing phase
    if (state.gamePhase !== 'playing') {
      return
    }

    // Get current player
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (!currentPlayer) {
      return
    }

    // Only execute for AI players
    if (!currentPlayer.isAI) {
      return
    }

    // Don't execute if there's an action in progress (snapshot exists)
    if (state.stateSnapshot !== null) {
      return
    }

    // Clear any previous timeouts from prior effect runs
    clearAllTimeouts()

    // Create or reuse AI player instance
    if (!aiPlayerRef.current || aiPlayerRef.current['difficulty'] !== currentPlayer.aiDifficulty) {
      aiPlayerRef.current = new AIPlayer(currentPlayer.aiDifficulty || 'medium')
    }

    // Capture the player ID for the closure
    const playerId = currentPlayer.id

    const delay = 2000 + Math.random() * 500

    const outerTimeout = window.setTimeout(() => {
      try {
        // Read the LATEST state from the ref
        const latestState = stateRef.current

        // Double-check we're still on this AI player's turn
        const cp = latestState.players[latestState.currentPlayerIndex]
        if (!cp || cp.id !== playerId || latestState.gamePhase !== 'playing') {
          return
        }

        const action = aiPlayerRef.current!.selectAction(latestState, playerId)
        // Notify caller about the AI action (for animations) before executing
        if (onAIActionRef.current) {
          onAIActionRef.current(action, latestState)
        }
        onExecuteActionRef.current(action)

        // Schedule end turn after a short delay
        const innerTimeout = window.setTimeout(() => {
          onEndTurnRef.current()
        }, 500)
        timeoutIdsRef.current.push(innerTimeout)
      } catch (error) {
        console.error('AI turn execution failed:', error)
        // Force end turn on error to prevent game freeze
        try {
          onEndTurnRef.current()
        } catch (endTurnError) {
          console.error('Failed to force end turn after AI error:', endTurnError)
        }
      }
    }, delay)
    timeoutIdsRef.current.push(outerTimeout)

    // Cleanup: clear timeouts if this effect re-runs or component unmounts
    return () => {
      clearAllTimeouts()
    }
    // Only depend on the values that determine "whose turn / can we act / which game"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayerIndex, state.gamePhase, state.stateSnapshot, state.gameId])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [])
}
