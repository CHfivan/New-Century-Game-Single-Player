import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TurnIndicator } from './TurnIndicator'

describe('TurnIndicator', () => {
  it('displays player name', () => {
    render(
      <TurnIndicator
        playerName="Player 1"
        turnNumber={1}
        isHumanTurn={true}
      />
    )
    
    expect(screen.getByText('Player 1')).toBeDefined()
  })

  it('displays turn number', () => {
    render(
      <TurnIndicator
        playerName="Player 1"
        turnNumber={5}
        isHumanTurn={true}
      />
    )
    
    expect(screen.getByText('Turn 5')).toBeDefined()
  })

  it('displays "Your Turn" message for human turn', () => {
    render(
      <TurnIndicator
        playerName="Player 1"
        turnNumber={1}
        isHumanTurn={true}
      />
    )
    
    expect(screen.getByText('👤 Your Turn')).toBeDefined()
  })

  it('displays "AI Thinking..." message when AI is thinking', () => {
    render(
      <TurnIndicator
        playerName="AI Player"
        turnNumber={1}
        isHumanTurn={false}
        isAIThinking={true}
      />
    )
    
    expect(screen.getByText('🤖 AI Thinking...')).toBeDefined()
  })

  it('displays "Waiting..." message for non-human, non-AI-thinking turn', () => {
    render(
      <TurnIndicator
        playerName="Player 2"
        turnNumber={1}
        isHumanTurn={false}
        isAIThinking={false}
      />
    )
    
    expect(screen.getByText('⏳ Waiting...')).toBeDefined()
  })

  it('applies human class for human turn', () => {
    const { container } = render(
      <TurnIndicator
        playerName="Player 1"
        turnNumber={1}
        isHumanTurn={true}
      />
    )
    
    const statusElement = container.querySelector('.turn-status')
    expect(statusElement?.classList.contains('human')).toBe(true)
  })

  it('applies ai class for AI turn', () => {
    const { container } = render(
      <TurnIndicator
        playerName="AI Player"
        turnNumber={1}
        isHumanTurn={false}
      />
    )
    
    const statusElement = container.querySelector('.turn-status')
    expect(statusElement?.classList.contains('ai')).toBe(true)
  })

  it('displays separator between turn number and player name', () => {
    render(
      <TurnIndicator
        playerName="Player 1"
        turnNumber={1}
        isHumanTurn={true}
      />
    )
    
    expect(screen.getByText('•')).toBeDefined()
  })
})
