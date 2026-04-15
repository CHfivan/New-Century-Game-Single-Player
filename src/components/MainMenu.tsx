/**
 * MainMenu component
 * Displays the main menu screen with New Game, Load Game, and Rules buttons
 * Requirements: 13.2
 */

import React, { useState, useEffect } from 'react'
import { loadSavedGame } from '../state/GameContext'
import { NewGameDialog } from './NewGameDialog'
import { RulesModal } from './RulesModal'
import './MainMenu.css'

interface MainMenuProps {
  onStartGame: (playerCount: number, aiCount: number, aiDifficulty: 'easy' | 'medium' | 'hard') => void
  onLoadGame: () => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLoadGame }) => {
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const [showNewGameDialog, setShowNewGameDialog] = useState(false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const saved = loadSavedGame()
    setHasSavedGame(saved !== null)
  }, [])

  const handleNewGameConfirm = (playerCount: number, aiCount: number, aiDifficulty: 'easy' | 'medium' | 'hard') => {
    setShowNewGameDialog(false)
    onStartGame(playerCount, aiCount, aiDifficulty)
  }

  return (
    <div className="main-menu">
      <div className="main-menu-content">
        <h1 className="main-menu-title">Century: Spice Road</h1>
        <p className="main-menu-subtitle">A card-based trading game</p>

        <div className="main-menu-buttons">
          <button
            className="menu-btn menu-btn-new"
            onClick={() => setShowNewGameDialog(true)}
            aria-label="Start a new game"
          >
            🎮 New Game
          </button>

          {hasSavedGame && (
            <button
              className="menu-btn menu-btn-load"
              onClick={onLoadGame}
              aria-label="Load saved game"
            >
              💾 Load Game
            </button>
          )}

          <button
            className="menu-btn menu-btn-rules"
            onClick={() => setShowRules(true)}
            aria-label="View game rules"
          >
            📖 Rules
          </button>
        </div>
      </div>

      {showNewGameDialog && (
        <NewGameDialog
          onConfirm={handleNewGameConfirm}
          onCancel={() => setShowNewGameDialog(false)}
        />
      )}

      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}
    </div>
  )
}
