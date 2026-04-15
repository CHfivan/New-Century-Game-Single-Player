/**
 * Unit tests for GameBoard3D component
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GameBoard3D } from './GameBoard3D'
import { GameEngine } from '../engine'

describe('GameBoard3D', () => {
  it('should render with valid game state', () => {
    const gameState = GameEngine.createGame(2, 1)
    const { container } = render(
      <GameBoard3D gameState={gameState} />
    )
    expect(container).toBeTruthy()
  })

  it('should render with merchant card click handler', () => {
    const gameState = GameEngine.createGame(2, 1)
    const handleClick = vi.fn()
    const { container } = render(
      <GameBoard3D
        gameState={gameState}
        onMerchantCardClick={handleClick}
      />
    )
    expect(container).toBeTruthy()
  })

  it('should render with point card click handler', () => {
    const gameState = GameEngine.createGame(2, 1)
    const handleClick = vi.fn()
    const { container } = render(
      <GameBoard3D
        gameState={gameState}
        onPointCardClick={handleClick}
      />
    )
    expect(container).toBeTruthy()
  })

  it('should render in disabled state', () => {
    const gameState = GameEngine.createGame(2, 1)
    const { container } = render(
      <GameBoard3D gameState={gameState} disabled={true} />
    )
    expect(container).toBeTruthy()
  })

  it('should render with all handlers and disabled state', () => {
    const gameState = GameEngine.createGame(3, 2)
    const handleMerchantClick = vi.fn()
    const handlePointClick = vi.fn()
    const { container } = render(
      <GameBoard3D
        gameState={gameState}
        onMerchantCardClick={handleMerchantClick}
        onPointCardClick={handlePointClick}
        disabled={false}
      />
    )
    expect(container).toBeTruthy()
  })

  it('should render with different player counts', () => {
    const gameState2 = GameEngine.createGame(2, 1)
    const gameState3 = GameEngine.createGame(3, 2)
    const gameState4 = GameEngine.createGame(4, 3)
    
    const { container: container2 } = render(<GameBoard3D gameState={gameState2} />)
    expect(container2).toBeTruthy()
    
    const { container: container3 } = render(<GameBoard3D gameState={gameState3} />)
    expect(container3).toBeTruthy()
    
    const { container: container4 } = render(<GameBoard3D gameState={gameState4} />)
    expect(container4).toBeTruthy()
  })
})
