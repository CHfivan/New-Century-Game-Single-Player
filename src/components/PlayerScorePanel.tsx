/**
 * PlayerScorePanel component
 * Displays player's score, coins, and victory cards count
 */

import React from 'react'
import { assetUrl } from '../utils/assetUrl'
import './PlayerScorePanel.css'

interface PlayerScorePanelProps {
  score: number
  goldCoins: number
  silverCoins: number
  victoryCardsCount: number
}

export const PlayerScorePanel: React.FC<PlayerScorePanelProps> = React.memo(({
  score,
  goldCoins,
  silverCoins,
  victoryCardsCount,
}) => {
  return (
    <div className="player-score-panel" role="region" aria-label={`Your score: ${score} points, ${goldCoins} gold coins, ${silverCoins} silver coins, ${victoryCardsCount} victory cards`}>
      <div className="score-item" title={`Score: ${score} points`}>
        <span className="score-label score-label-mobile" aria-hidden="true">⭐</span>
        <span className="score-label score-label-desktop">Score:</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-item" title={`${goldCoins} gold coins`}>
        <img src={assetUrl('/assets/image/gold_coin.png')} alt="Gold coins" className="coin-icon" />
        <span className="score-value">{goldCoins}</span>
      </div>
      <div className="score-item" title={`${silverCoins} silver coins`}>
        <img src={assetUrl('/assets/image/silver_coin.png')} alt="Silver coins" className="coin-icon" />
        <span className="score-value">{silverCoins}</span>
      </div>
      <div className="score-item" title={`${victoryCardsCount} victory cards`}>
        <span className="score-label score-label-mobile" aria-hidden="true">🏆</span>
        <span className="score-label score-label-desktop">Victory Cards:</span>
        <span className="score-value">{victoryCardsCount}</span>
      </div>
    </div>
  )
})
