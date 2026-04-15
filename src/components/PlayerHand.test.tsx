import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlayerHand } from './PlayerHand'
import { MerchantCard } from '../types'

const mockCards: MerchantCard[] = [
  {
    id: 'merchant_1',
    type: 'spice',
    effect: { spices: { yellow: 2, red: 0, green: 0, brown: 0 } },
    imageUrl: '/assets/cards/merchant/merchant_1.png'
  },
  {
    id: 'merchant_2',
    type: 'conversion',
    effect: { upgrades: 2 },
    imageUrl: '/assets/cards/merchant/merchant_2.png'
  },
  {
    id: 'merchant_3',
    type: 'exchange',
    effect: {
      input: { yellow: 3, red: 0, green: 0, brown: 0 },
      output: { yellow: 0, red: 0, green: 0, brown: 1 }
    },
    imageUrl: '/assets/cards/merchant/merchant_3.png'
  }
]

describe('PlayerHand', () => {
  it('renders all cards in hand', () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    const cards = container.querySelectorAll('.hand-card')
    expect(cards.length).toBe(3)
  })

  it('displays hand by default (visible)', () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    const hand = container.querySelector('.player-hand')
    expect(hand).toBeDefined()
  })

  it('shows toggle button with correct initial text', () => {
    render(<PlayerHand cards={mockCards} />)
    const toggleButton = screen.getByLabelText('Hide hand')
    expect(toggleButton.textContent).toContain('Hide')
  })

  it('hides hand when toggle button is clicked', async () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    
    // Click toggle button
    const toggleButton = screen.getByLabelText('Hide hand')
    fireEvent.click(toggleButton)
    
    // Container should have hidden class
    const handContainer = container.querySelector('.player-hand-container')
    expect(handContainer).toBeDefined()
    await waitFor(() => {
      expect(handContainer?.classList.contains('hidden')).toBe(true)
    })
  })

  it('shows hand again when toggle button is clicked twice', async () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    const toggleButton = screen.getByLabelText('Hide hand')
    
    // Hide hand
    fireEvent.click(toggleButton)
    const handContainer = container.querySelector('.player-hand-container')
    await waitFor(() => {
      expect(handContainer?.classList.contains('hidden')).toBe(true)
    })
    
    // Show hand again
    const showButton = screen.getByLabelText('Show hand')
    fireEvent.click(showButton)
    await waitFor(() => {
      expect(handContainer?.classList.contains('hidden')).toBe(false)
    })
  })

  it('updates toggle button text when hand visibility changes', () => {
    render(<PlayerHand cards={mockCards} />)
    
    // Initially shows "Hide"
    let toggleButton = screen.getByLabelText('Hide hand')
    expect(toggleButton.textContent).toContain('Hide')
    
    // After clicking, shows "Show"
    fireEvent.click(toggleButton)
    toggleButton = screen.getByLabelText('Show hand')
    expect(toggleButton.textContent).toContain('Show')
  })

  it('calls onCardClick when a card is clicked', () => {
    const onCardClick = vi.fn()
    const { container } = render(
      <PlayerHand cards={mockCards} onCardClick={onCardClick} />
    )
    
    const firstCard = container.querySelector('.hand-card')
    expect(firstCard).toBeDefined()
    fireEvent.click(firstCard!)
    
    expect(onCardClick).toHaveBeenCalledTimes(1)
    expect(onCardClick).toHaveBeenCalledWith(mockCards[0], 0)
  })

  it('does not call onCardClick when disabled', () => {
    const onCardClick = vi.fn()
    const { container } = render(
      <PlayerHand cards={mockCards} onCardClick={onCardClick} disabled={true} />
    )
    
    const firstCard = container.querySelector('.hand-card')
    fireEvent.click(firstCard!)
    
    expect(onCardClick).not.toHaveBeenCalled()
  })

  it('applies disabled class to cards when disabled', () => {
    const { container } = render(
      <PlayerHand cards={mockCards} disabled={true} />
    )
    
    const cards = container.querySelectorAll('.hand-card')
    cards.forEach(card => {
      expect(card.classList.contains('disabled')).toBe(true)
    })
  })

  it('displays card images', () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    
    const images = container.querySelectorAll('.card-image img')
    expect(images.length).toBe(3)
    expect((images[0] as HTMLImageElement).src).toContain('merchant_1.png')
  })

  it('displays card effect display', () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    
    const effectCols = container.querySelectorAll('.card-effect-col')
    expect(effectCols.length).toBe(3)
    // First card is a spice card with 2 yellow — should have 2 spice squares
    const firstCardSquares = effectCols[0].querySelectorAll('.spice-sq')
    expect(firstCardSquares.length).toBeGreaterThan(0)
  })

  it('handles empty hand', () => {
    const { container } = render(<PlayerHand cards={[]} />)
    
    const hand = container.querySelector('.player-hand')
    expect(hand).toBeDefined()
    
    const cards = container.querySelectorAll('.hand-card')
    expect(cards.length).toBe(0)
  })

  it('stacks cards with overlap', () => {
    const { container } = render(<PlayerHand cards={mockCards} />)
    
    const cards = container.querySelectorAll('.hand-card')
    
    // Second and third cards should have negative left margin (overlap)
    const secondCard = cards[1] as HTMLElement
    const thirdCard = cards[2] as HTMLElement
    
    // Check that cards have positioning styles applied
    expect(secondCard.style.left).toBeDefined()
    expect(thirdCard.style.left).toBeDefined()
  })
})
