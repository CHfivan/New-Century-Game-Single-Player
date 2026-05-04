/**
 * MultiplayerGameBoard — bridges multiplayer server state into the
 * single-player GameContext so the existing DemoContent component can
 * render the full game board without changes.
 *
 * Strategy:
 * - Read gameState, myPlayerIndex, isMyTurn, sendAction from MultiplayerContext
 * - Maintain a local copy of the game state via useReducer (same gameReducer)
 * - Sync local state whenever the server broadcasts a new gameState
 * - For game-mutating actions (EXECUTE_GAME_ACTION, COMMIT_ACTION, END_TURN):
 *   forward the GameAction to the server via sendAction() and let the server
 *   broadcast the authoritative state back
 * - For UI-only actions (BEGIN_ACTION, CANCEL_ACTION): handle locally
 * - Mark the local player as isAI=false and all others as isAI=true so
 *   DemoContent's `humanPlayer = state.players.find(p => !p.isAI)` picks
 *   the correct player
 * - AI turns are handled client-side by the HOST via useAITurn hook.
 *   The host computes AI actions locally (with animations), sends them to
 *   the server, and the server broadcasts to all clients. Non-host clients
 *   receive AI actions as remote actions and animate them normally.
 *
 * Requirements: 4.2, 4.3, 4.5, 7.2, 7.5, 12.7
 */

import React, { useReducer, useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useMultiplayer } from '../../multiplayer/MultiplayerContext'
import { GameContext } from '../../state/GameContext'
import { gameReducer, createInitialState } from '../../state/gameReducer'
import { useAITurn } from '../../state/useAITurn'
import { DemoContent } from '../../Demo'
import { assetUrl } from '../../utils/assetUrl'
import type { GameContextValue } from '../../types/state'
import type { StateAction } from '../../types/state'
import type { GameState, GameAction, MerchantCard, PointCard } from '../../types/game'
import './MultiplayerGameBoard.css'

export interface MultiplayerGameBoardProps {
  onLeave: () => void
}

/**
 * Fix image URLs in cards received from the server.
 * The server uses BASE_URL='/' but the client may use a different base path
 * (e.g., '/New-Century-Game-Single-Player/' on GitHub Pages).
 */
function fixCardImageUrl<T extends { imageUrl: string }>(card: T): T {
  // If the URL already contains the base path, skip
  const base = import.meta.env.BASE_URL || '/'
  if (base !== '/' && card.imageUrl.startsWith(base)) return card
  // If the URL starts with '/', apply assetUrl to prepend the base
  if (card.imageUrl.startsWith('/')) {
    return { ...card, imageUrl: assetUrl(card.imageUrl) }
  }
  return card
}

function fixGameStateImageUrls(gs: GameState): GameState {
  return {
    ...gs,
    merchantCardRow: gs.merchantCardRow.map(fixCardImageUrl) as MerchantCard[],
    pointCardRow: gs.pointCardRow.map(fixCardImageUrl) as PointCard[],
    merchantDeck: gs.merchantDeck.map(fixCardImageUrl) as MerchantCard[],
    pointDeck: gs.pointDeck.map(fixCardImageUrl) as PointCard[],
    players: gs.players.map(p => ({
      ...p,
      hand: p.hand.map(fixCardImageUrl) as MerchantCard[],
      playedCards: p.playedCards.map(fixCardImageUrl) as MerchantCard[],
      pointCards: p.pointCards.map(fixCardImageUrl) as PointCard[],
    })),
  }
}

/**
 * Rewrite a GameState so that the player at `myIndex` has isAI=false
 * and every other player has isAI=true.  This lets DemoContent's
 * `state.players.find(p => !p.isAI)` identify "my" player correctly.
 * Also fixes image URLs from the server.
 */
function tagPlayers(gs: GameState, myIndex: number | null): GameState {
  const fixed = fixGameStateImageUrls(gs)
  return {
    ...fixed,
    players: fixed.players.map((p, i) => ({
      ...p,
      // For DemoContent rendering: local player = isAI:false, all others = isAI:true
      // This lets DemoContent's find(p => !p.isAI) identify "my" player
      isAI: i !== myIndex,
    })),
  }
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({ onLeave }) => {
  const {
    gameState,
    myPlayerIndex,
    isMyTurn,
    sendAction,
    disconnectedPlayers,
    error,
    lastAction,
    lastActionPlayerIndex,
    roomCode,
    isHost,
    sendDiscard,
    restartGame,
  } = useMultiplayer()

  const handleNewGame = useCallback(() => {
    restartGame()
  }, [restartGame])

  // Local reducer mirrors the server state but also handles UI-only
  // actions (BEGIN_ACTION / CANCEL_ACTION) that never leave the client.
  // Initialize with the server state (tagged) so we never flash the setup screen.
  const initialState = useMemo(() => {
    if (gameState) {
      const savedName = sessionStorage.getItem('multiplayer-player-name')
      let myIdx = myPlayerIndex
      if (myIdx === null && savedName) {
        myIdx = gameState.players.findIndex(p => p.name === savedName)
        if (myIdx < 0) myIdx = null
      }
      return tagPlayers(gameState, myIdx)
    }
    return createInitialState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only compute once on mount

  const [localState, localDispatch] = useReducer(gameReducer, initialState)

  // Keep a ref to the latest local state so callbacks always read fresh data
  const localStateRef = useRef(localState)
  localStateRef.current = localState

  // Track whether we've received the first server state
  const hasServerState = gameState !== null

  // Ref for the animation callback that DemoContent registers.
  const aiAnimCallbackRef = useRef<((action: GameAction, state: any) => void) | null>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Animation queue system ──────────────────────────────────────────────
  // Remote actions (from other human players or AI actions on non-host clients)
  // are queued and processed one at a time so animations don't overlap.
  interface QueuedUpdate {
    gameState: GameState
    action: GameAction | null
    playerIndex: number | null
  }
  const updateQueueRef = useRef<QueuedUpdate[]>([])
  const isProcessingRef = useRef(false)

  // ── Dealing animation gate ──────────────────────────────────────────────
  // Don't process remote actions or enable AI turns until dealing completes.
  const [dealingComplete, setDealingComplete] = useState(false)
  const dealingCompleteRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      dealingCompleteRef.current = true
      setDealingComplete(true)
      // Start processing any queued updates that arrived during dealing
      processNextUpdate()
    }, 6000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Process the next update in the queue
  const processNextUpdate = useCallback(() => {
    if (isProcessingRef.current) return
    if (updateQueueRef.current.length === 0) return
    if (!dealingCompleteRef.current) return

    isProcessingRef.current = true
    const update = updateQueueRef.current.shift()!
    const { gameState: gs, action, playerIndex } = update

    const isRemote = action !== null && playerIndex !== null && playerIndex !== myPlayerIndex

    if (isRemote && aiAnimCallbackRef.current && action) {
      // Trigger animation using the current local state
      aiAnimCallbackRef.current(action, localStateRef.current)

      // Wait for animation to complete, then apply the authoritative server state
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
      animTimerRef.current = setTimeout(() => {
        const tagged = tagPlayers(gs, myPlayerIndex)
        localDispatch({ type: 'LOAD_GAME', payload: tagged })
        isProcessingRef.current = false
        // Process next queued update after a short pause
        setTimeout(() => processNextUpdate(), 750)
      }, 2500) // Apply just before animation clones disappear
    } else {
      // Local action or no animation needed — apply immediately
      const tagged = tagPlayers(gs, myPlayerIndex)
      localDispatch({ type: 'LOAD_GAME', payload: tagged })
      isProcessingRef.current = false
      // Process next immediately
      setTimeout(() => processNextUpdate(), 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayerIndex])

  // When new server state arrives, route it appropriately
  const prevGameStateRef = useRef<GameState | null>(null)
  useEffect(() => {
    if (!gameState) return
    if (gameState === prevGameStateRef.current) return
    prevGameStateRef.current = gameState

    const hasAction = lastAction !== null && lastActionPlayerIndex !== null

    if (hasAction) {
      const isFromLocalPlayer = lastActionPlayerIndex === myPlayerIndex
      // On the host, AI actions were already animated locally by useAITurn.
      // The server echoes them back — just apply the authoritative state.
      // Use the SERVER's isAI flag (not localState which tags all non-local as isAI=true)
      const isHostAIEcho = isHost && lastActionPlayerIndex !== myPlayerIndex &&
        gameState.players[lastActionPlayerIndex!]?.isAI === true

      if (isFromLocalPlayer || isHostAIEcho) {
        // Local player action or host's AI action — apply immediately (animation already played)
        const tagged = tagPlayers(gameState, myPlayerIndex)
        localDispatch({ type: 'LOAD_GAME', payload: tagged })
      } else {
        // Remote action (other human player, or AI action on non-host client)
        // Queue for sequential animation processing
        updateQueueRef.current.push({
          gameState,
          action: lastAction,
          playerIndex: lastActionPlayerIndex,
        })
        processNextUpdate()
      }
    } else {
      // No action — initial state, reconnect, or discard. Apply immediately.
      const tagged = tagPlayers(gameState, myPlayerIndex)
      localDispatch({ type: 'LOAD_GAME', payload: tagged })
    }
  }, [gameState, myPlayerIndex, lastAction, lastActionPlayerIndex, isHost, processNextUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
    }
  }, [])

  // ── AI turn handling (host only) ────────────────────────────────────────
  // The host runs useAITurn to compute AI actions locally, animate them,
  // and send them to the server. Non-host clients receive AI actions as
  // remote state updates and animate them via the queue system above.
  //
  // useAITurn needs a state where AI players have isAI=true. But our
  // localState has tagPlayers applied (only myPlayer has isAI=false).
  // That's exactly what we want — AI players ARE marked isAI=true.

  const handleAIExecuteAction = useCallback((action: GameAction) => {
    // Send the AI action to the server (host acting on behalf of AI)
    // Don't apply locally — wait for the server's authoritative state update.
    // This prevents local state from drifting ahead and triggering duplicate AI turns.
    sendAction(action)
  }, [sendAction])

  const handleAIEndTurn = useCallback(() => {
    // Don't advance turn locally — let the server handle it.
    // The server's state update will set the correct currentPlayerIndex.
    // This prevents local state from drifting ahead of the server.
  }, [])

  const handleAIAction = useCallback((action: GameAction, state: GameState) => {
    // Trigger animation via the callback registered by DemoContent
    if (aiAnimCallbackRef.current) {
      aiAnimCallbackRef.current(action, state)
    }
  }, [])

  // Only the host runs AI turns, and only after dealing animation completes.
  // IMPORTANT: Use the SERVER's game state with REAL isAI flags for AI turn detection.
  // tagPlayers marks all non-local players as isAI=true (for rendering), but useAITurn
  // needs the real flags to distinguish actual AI players from human opponents.
  const serverStateForAI = useMemo(() => {
    if (!gameState) return localState
    // Apply image URL fixes but preserve the server's real isAI flags
    const fixed = fixGameStateImageUrls(gameState)
    return {
      ...fixed,
      // Set local player to isAI=false, keep server's isAI for everyone else
      players: fixed.players.map((p, i) => ({
        ...p,
        isAI: i === myPlayerIndex ? false : p.isAI,
      })),
    }
  }, [gameState, myPlayerIndex, localState])

  useAITurn({
    state: serverStateForAI,
    onExecuteAction: handleAIExecuteAction,
    onEndTurn: handleAIEndTurn,
    onAIAction: handleAIAction,
    disabled: !isHost || !dealingComplete,
  })

  // Bridge dispatch: intercept actions and route them appropriately
  const bridgeDispatch = useCallback(
    (action: StateAction) => {
      switch (action.type) {
        // ── Game-mutating actions → send to server ──────────────────────
        case 'EXECUTE_GAME_ACTION': {
          // Send the GameAction payload to the server
          sendAction(action.payload)
          // Also apply locally for immediate UI feedback (optimistic)
          localDispatch(action)
          break
        }

        case 'COMMIT_ACTION': {
          // Send the GameAction payload to the server
          sendAction(action.payload)
          // Apply locally for immediate feedback
          localDispatch(action)
          break
        }

        case 'END_TURN': {
          // The server handles turn advancement when it processes the action.
          // We apply locally for immediate UI feedback; the next server
          // state-update will overwrite with the authoritative state.
          localDispatch(action)
          break
        }

        // ── UI-only actions → handle locally ────────────────────────────
        case 'BEGIN_ACTION':
        case 'CANCEL_ACTION': {
          localDispatch(action)
          break
        }

        // ── Actions the server manages → apply locally for UI ───────────
        case 'LOAD_GAME': {
          // Used by discard flow to patch caravan locally
          localDispatch(action)
          break
        }

        // ── Ignored in multiplayer ──────────────────────────────────────
        case 'INIT_GAME':
        case 'SAVE_GAME': {
          // Server manages game lifecycle; ignore these
          break
        }

        default: {
          // Forward anything else to local reducer
          localDispatch(action)
        }
      }
    },
    [sendAction]
  )

  // Build the GameContextValue that DemoContent expects
  const currentPlayer = useMemo(() => {
    if (localState.gamePhase === 'setup' || localState.gamePhase === 'ended') {
      return null
    }
    return localState.players[localState.currentPlayerIndex] || null
  }, [localState.players, localState.currentPlayerIndex, localState.gamePhase])

  // Compute isHumanTurn from LOCAL state (not server's isMyTurn) so it updates
  // immediately after local EXECUTE_GAME_ACTION + END_TURN dispatches
  const localIsHumanTurn = useMemo(() => {
    if (myPlayerIndex === null) return false
    const localCurrentPlayer = localState.players[localState.currentPlayerIndex]
    if (!localCurrentPlayer) return false
    // The local player has isAI=false (set by tagPlayers)
    return !localCurrentPlayer.isAI
  }, [localState.currentPlayerIndex, localState.players, myPlayerIndex])

  // Use the SERVER's isMyTurn for action button enabling.
  // This prevents local state drift from allowing actions at the wrong time.
  // The server is the source of truth for whose turn it is.
  const contextValue: GameContextValue = useMemo(
    () => ({
      state: localState,
      dispatch: bridgeDispatch,
      currentPlayer,
      isHumanTurn: isMyTurn,
      actionInProgress: localState.stateSnapshot !== null,
    }),
    [localState, bridgeDispatch, currentPlayer, isMyTurn]
  )

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!hasServerState) {
    return (
      <div className="mp-board">
        <div className="mp-board-content">
          <p className="mp-board-loading">Waiting for game state…</p>
        </div>
      </div>
    )
  }

  // ── Render the full game board via DemoContent ────────────────────────────
  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="mp-board-error-overlay" role="alert">{error}</div>
      )}

      {/* Disconnection notices */}
      {disconnectedPlayers.length > 0 && (
        <div className="mp-board-disconnect-overlay" role="status">
          {disconnectedPlayers.map((name) => (
            <div key={name} className="mp-board-disconnect-notice">
              ⚠️ {name} has disconnected — waiting for reconnection…
            </div>
          ))}
        </div>
      )}

      {/* Provide the bridged GameContext so DemoContent's useGame() works */}
      <GameContext.Provider value={contextValue}>
        <DemoContent aiAnimCallbackRef={aiAnimCallbackRef} triggerDealing={true} onLeaveGame={onLeave} onNewGame={isHost ? handleNewGame : undefined} roomCode={roomCode} isHost={isHost} onDiscard={sendDiscard} />
      </GameContext.Provider>
    </>
  )
}
