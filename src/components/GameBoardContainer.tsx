/**
 * GameBoardContainer component
 * Wrapper that adjusts game board position based on opponent panel width
 */

import React from 'react'
import './GameBoardContainer.css'

interface GameBoardContainerProps {
  children: React.ReactNode
  opponentPanelWidth: number
}

export const GameBoardContainer: React.FC<GameBoardContainerProps> = ({
  children,
  opponentPanelWidth,
}) => {
  return (
    <div
      className="game-board-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: `${opponentPanelWidth}px`,
        bottom: 0,
      }}
    >
      {children}
    </div>
  )
}
