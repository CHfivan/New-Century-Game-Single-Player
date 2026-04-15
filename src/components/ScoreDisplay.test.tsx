import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from './ScoreDisplay'
import { Player } from '../types'

const mockPlayers: Player[] = [
  {
    id: 'player1',
    name: 'Player 1',
    isAI: false,
    caravan: { yellow: 3, red: 0, green: 0, brown: 0 },
    hand: [],
    playedCards: [],
    pointCards: [],
    coins: { gold: 0, silver: 0 },
    score: 15,
    statistics: {
      cubesGained: { yellow: 0, red: 0, green: 0, brown: 0 },
      cubesSpent: { yellow: 0, red: 0, green: 0, brown: 0 },
      merchantCardsPlayed: 0,
      merchantCardsAcquired: 0,
      restActionsTaken: 0,
      cardUsageCount: new Map(),
      pointProgression: [],
      turnTimings: [],
      turnStartTime: null
    }
  },
  {
    id: 'player2',
    name: 'Player 2',
    isAI: true,
    caravan: { yellow: 4, red: 0, green: 0, brown: 0 },
    hand: [],
    playedCards: [],
    pointCards: [],
    coins: { gold: 1, silver: 0 },
    score: 20,
    statistics: {
      cubesGained: { yellow: 0, red: 0, green: 0, brown: 0 },
      cubesSpent: { yellow: 0, red: 0, green: 0, brown: 0 },
      merchantCardsPlayed: 0,
      merchantCardsAcquired: 0,
      restActionsTaken: 0,
      cardUsageCount: new Map(),
      pointProgression: [],
      turnTimings: [],
      turnStartTime: null
    }
  },
  {
    id: 'player3',
    name: 'Player 3',
    isAI: true,
    caravan: { yellow: 2, red: 1, green: 0, brown: 0 },
    hand: [],
    playedCards: [],
    pointCards: [],
    coins: { gold: 0, silver: 1 },
    score: 10,
    statistics: {
      cubesGained: { yellow: 0, red: 0, green: 0, brown: 0 },
      cubesSpent: { yellow: 0, red: 0, green: 0, brown: 0 },
      merchantCardsPlayed: 0,
      merchantCardsAcquired: 0,
      restActionsTaken: 0,
      cardUsageCount: new Map(),
      pointProgression: [],
      turnTimings: [],
      turnStartTime: null
    }
  }
]

describe('ScoreDisplay', () => {
  it('displays all player names', () => {
    render(<ScoreDisplay players={mockPlayers} currentPlayerId="player1" />)
    
    expect(screen.getByText('Player 1')).toBeDefined()
    expect(screen.getByText('Player 2')).toBeDefined()
    expect(screen.getByText('Player 3')).toBeDefined()
  })

  it('displays all player scores', () => {
    render(<ScoreDisplay players={mockPlayers} currentPlayerId="player1" />)
    
    expect(screen.getByText('15 pts')).toBeDefined()
    expect(screen.getByText('20 pts')).toBeDefined()
    expect(screen.getByText('10 pts')).toBeDefined()
  })

  it('sorts players by score in descending order', () => {
    const { container } = render(
      <ScoreDisplay players={mockPlayers} currentPlayerId="player1" />
    )
    
    const scoreItems = container.querySelectorAll('.score-item')
    const names = Array.from(scoreItems).map(item => 
      item.querySelector('.score-name')?.textContent
    )
    
    // Should be sorted: Player 2 (20), Player 1 (15), Player 3 (10)
    expect(names[0]).toBe('Player 2')
    expect(names[1]).toBe('Player 1')
    expect(names[2]).toBe('Player 3')
  })

  it('displays rank numbers', () => {
    render(<ScoreDisplay players={mockPlayers} currentPlayerId="player1" />)
    
    expect(screen.getByText('#1')).toBeDefined()
    expect(screen.getByText('#2')).toBeDefined()
    expect(screen.getByText('#3')).toBeDefined()
  })

  it('highlights current player', () => {
    const { container } = render(
      <ScoreDisplay players={mockPlayers} currentPlayerId="player1" />
    )
    
    const scoreItems = container.querySelectorAll('.score-item')
    const player1Item = Array.from(scoreItems).find(item =>
      item.querySelector('.score-name')?.textContent === 'Player 1'
    )
    
    expect(player1Item?.classList.contains('current')).toBe(true)
  })

  it('does not highlight non-current players', () => {
    const { container } = render(
      <ScoreDisplay players={mockPlayers} currentPlayerId="player1" />
    )
    
    const scoreItems = container.querySelectorAll('.score-item')
    const player2Item = Array.from(scoreItems).find(item =>
      item.querySelector('.score-name')?.textContent === 'Player 2'
    )
    
    expect(player2Item?.classList.contains('current')).toBe(false)
  })

  it('displays title "Scores"', () => {
    render(<ScoreDisplay players={mockPlayers} currentPlayerId="player1" />)
    
    expect(screen.getByText('Scores')).toBeDefined()
  })

  it('handles single player', () => {
    render(
      <ScoreDisplay players={[mockPlayers[0]]} currentPlayerId="player1" />
    )
    
    expect(screen.getByText('Player 1')).toBeDefined()
    expect(screen.getByText('#1')).toBeDefined()
  })

  it('handles tied scores correctly', () => {
    const tiedPlayers: Player[] = [
      { ...mockPlayers[0], score: 15 },
      { ...mockPlayers[1], score: 15 },
      { ...mockPlayers[2], score: 10 }
    ]
    
    const { container } = render(
      <ScoreDisplay players={tiedPlayers} currentPlayerId="player1" />
    )
    
    const scoreItems = container.querySelectorAll('.score-item')
    
    // Both players with score 15 should be displayed
    expect(scoreItems.length).toBe(3)
  })
})
