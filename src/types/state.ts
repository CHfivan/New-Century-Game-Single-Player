/**
 * State management types for React Context and reducers
 */

import { GameState, GameAction } from './game'

/**
 * State action types for the game reducer
 */
export type StateActionType =
  | 'INIT_GAME'
  | 'EXECUTE_GAME_ACTION'
  | 'END_TURN'
  | 'LOAD_GAME'
  | 'SAVE_GAME'
  | 'BEGIN_ACTION'
  | 'CANCEL_ACTION'
  | 'COMMIT_ACTION'

/**
 * Payload for initializing a new game
 */
export interface InitGamePayload {
  playerCount: number
  aiCount: number
  aiDifficulty?: 'easy' | 'medium' | 'hard'
}

/**
 * Payload for beginning a multi-step action
 */
export interface BeginActionPayload {
  actionType: string
}

/**
 * State actions that can be dispatched
 */
export type StateAction =
  | { type: 'INIT_GAME'; payload: InitGamePayload }
  | { type: 'EXECUTE_GAME_ACTION'; payload: GameAction }
  | { type: 'END_TURN' }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SAVE_GAME' }
  | { type: 'BEGIN_ACTION'; payload: BeginActionPayload }
  | { type: 'CANCEL_ACTION' }
  | { type: 'COMMIT_ACTION'; payload: GameAction }

/**
 * Game context value provided to components
 */
export interface GameContextValue {
  state: GameState
  dispatch: (action: StateAction) => void
  currentPlayer: Player | null
  isHumanTurn: boolean
  actionInProgress: boolean
}

/**
 * Re-export Player type for convenience
 */
import { Player } from './game'
export type { Player }
