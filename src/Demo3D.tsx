/**
 * Demo3D component to showcase the 3D rendering components
 */

import React, { useState, useEffect } from 'react'
import { GameProvider, useGame } from './state'
import { GameBoard3D } from './3d'
import {
  HamburgerMenu,
  TurnIndicator,
  ActionButtons,
  ScoreDisplay,
} from './components'
import './Demo.css'

/**
 * Check if WebGL is supported
 */
const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

const Demo3DContent: React.FC = () => {
  const { state, dispatch, currentPlayer, isHumanTurn } = useGame()
  const [webglSupported, setWebglSupported] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    // Check WebGL support on mount
    if (!isWebGLSupported()) {
      setWebglSupported(false)
      setRenderError('WebGL is not supported on this device')
    }
  }, [])

  const handleInitGame = () => {
    dispatch({
      type: 'INIT_GAME',
      payload: {
        playerCount: 3,
        aiCount: 2,
      },
    })
  }

  const handleShowRules = () => {
    alert('Game Rules:\n\n1. Play cards to gain spices\n2. Acquire merchant cards\n3. Claim point cards\n4. First to 5-6 point cards wins!')
  }

  const handleRestartGame = () => {
    if (confirm('Are you sure you want to restart the game?')) {
      handleInitGame()
    }
  }

  const handleMerchantCardClick = (cardIndex: number) => {
    console.log('Merchant card clicked:', cardIndex)
    // TODO: Implement acquire card logic
  }

  const handlePointCardClick = (cardIndex: number) => {
    console.log('Point card clicked:', cardIndex)
    // TODO: Implement claim point card logic
  }

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' })
  }

  // Show error message if WebGL is not supported
  if (!webglSupported || renderError) {
    return (
      <>
        <HamburgerMenu
          onShowRules={handleShowRules}
          onRestartGame={handleRestartGame}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1000,
          background: 'rgba(255, 200, 200, 0.95)',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px',
        }}>
          <h1>3D View Not Available</h1>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            {renderError || 'Your device does not support WebGL, which is required for 3D rendering.'}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Please use the 2D view instead, or try a different browser/device.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            Switch to 2D View
          </button>
        </div>
      </>
    )
  }

  if (state.gamePhase === 'setup') {
    return (
      <>
        <HamburgerMenu
          onShowRules={handleShowRules}
          onRestartGame={handleRestartGame}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <h1>Century: Spice Road - 3D View</h1>
          <p>This demo showcases the 3D rendering components.</p>
          <button 
            onClick={handleInitGame} 
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            Start New Game (3 Players: 1 Human + 2 AI)
          </button>
        </div>
      </>
    )
  }

  if (state.gamePhase === 'ended') {
    const winner = state.winner !== null ? state.players[state.winner] : null
    return (
      <>
        <HamburgerMenu
          onShowRules={handleShowRules}
          onRestartGame={handleRestartGame}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <h1>Game Over!</h1>
          <h2>Winner: {winner?.name || 'Unknown'}</h2>
          <p>Final Score: {winner?.score || 0} points</p>
          <button 
            onClick={handleInitGame}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            Start New Game
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowRules={handleShowRules}
        onRestartGame={handleRestartGame}
      />

      {/* Turn Indicator */}
      {currentPlayer && (
        <TurnIndicator
          playerName={currentPlayer.name}
          turnNumber={state.turnNumber}
          isHumanTurn={isHumanTurn}
          isAIThinking={!isHumanTurn}
        />
      )}

      {/* Score Display */}
      <ScoreDisplay
        players={state.players}
        currentPlayerId={currentPlayer?.id || ''}
      />

      {/* Action Buttons */}
      <ActionButtons
        onEndTurn={handleEndTurn}
        disabled={!isHumanTurn}
      />

      {/* 3D Game Board */}
      <React.Suspense fallback={
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          fontSize: '18px',
        }}>
          Loading 3D Scene...
        </div>
      }>
        <GameBoard3D
          gameState={state}
          onMerchantCardClick={handleMerchantCardClick}
          onPointCardClick={handlePointCardClick}
          disabled={!isHumanTurn}
        />
      </React.Suspense>

      {/* Instructions Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '300px',
        zIndex: 100,
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>3D Controls</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Left click + drag: Rotate view</li>
          <li>Right click + drag: Pan view</li>
          <li>Scroll: Zoom in/out</li>
          <li>Click cards to interact</li>
        </ul>
      </div>
    </>
  )
}

export const Demo3D: React.FC = () => {
  return (
    <GameProvider>
      <Demo3DContent />
    </GameProvider>
  )
}
