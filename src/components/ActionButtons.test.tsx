import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButtons } from './ActionButtons'

describe('ActionButtons', () => {
  const mockHandlers = {
    onPlayCard: vi.fn(),
    onAcquireCard: vi.fn(),
    onClaimPoint: vi.fn(),
    onRest: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 4 action buttons', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    expect(screen.getByText('Play Card')).toBeDefined()
    expect(screen.getByText('Acquire Card')).toBeDefined()
    expect(screen.getByText('Claim Point')).toBeDefined()
    expect(screen.getByText('Rest')).toBeDefined()
  })

  it('calls onPlayCard when Play Card button is clicked', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Play Card'))
    expect(mockHandlers.onPlayCard).toHaveBeenCalledTimes(1)
  })

  it('calls onAcquireCard when Acquire Card button is clicked', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Acquire Card'))
    expect(mockHandlers.onAcquireCard).toHaveBeenCalledTimes(1)
  })

  it('calls onClaimPoint when Claim Point button is clicked', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Claim Point'))
    expect(mockHandlers.onClaimPoint).toHaveBeenCalledTimes(1)
  })

  it('calls onRest when Rest button is clicked', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Rest'))
    expect(mockHandlers.onRest).toHaveBeenCalledTimes(1)
  })

  it('disables all buttons when disabled prop is true', () => {
    render(<ActionButtons {...mockHandlers} disabled={true} />)
    
    const playCardButton = screen.getByText('Play Card') as HTMLButtonElement
    const acquireCardButton = screen.getByText('Acquire Card') as HTMLButtonElement
    const claimPointButton = screen.getByText('Claim Point') as HTMLButtonElement
    const restButton = screen.getByText('Rest') as HTMLButtonElement
    
    expect(playCardButton.disabled).toBe(true)
    expect(acquireCardButton.disabled).toBe(true)
    expect(claimPointButton.disabled).toBe(true)
    expect(restButton.disabled).toBe(true)
  })

  it('disables Play Card button when playCardDisabled is true', () => {
    render(<ActionButtons {...mockHandlers} playCardDisabled={true} />)
    
    const button = screen.getByText('Play Card') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('disables Acquire Card button when acquireCardDisabled is true', () => {
    render(<ActionButtons {...mockHandlers} acquireCardDisabled={true} />)
    
    const button = screen.getByText('Acquire Card') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('disables Claim Point button when claimPointDisabled is true', () => {
    render(<ActionButtons {...mockHandlers} claimPointDisabled={true} />)
    
    const button = screen.getByText('Claim Point') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('disables Rest button when restDisabled is true', () => {
    render(<ActionButtons {...mockHandlers} restDisabled={true} />)
    
    const button = screen.getByText('Rest') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('does not call handlers when buttons are disabled', () => {
    render(<ActionButtons {...mockHandlers} disabled={true} />)
    
    fireEvent.click(screen.getByText('Play Card'))
    fireEvent.click(screen.getByText('Acquire Card'))
    fireEvent.click(screen.getByText('Claim Point'))
    fireEvent.click(screen.getByText('Rest'))
    
    expect(mockHandlers.onPlayCard).not.toHaveBeenCalled()
    expect(mockHandlers.onAcquireCard).not.toHaveBeenCalled()
    expect(mockHandlers.onClaimPoint).not.toHaveBeenCalled()
    expect(mockHandlers.onRest).not.toHaveBeenCalled()
  })

  it('applies secondary class to all buttons', () => {
    render(<ActionButtons {...mockHandlers} />)
    
    const playCardButton = screen.getByText('Play Card')
    const acquireCardButton = screen.getByText('Acquire Card')
    const claimPointButton = screen.getByText('Claim Point')
    const restButton = screen.getByText('Rest')
    
    expect(playCardButton.classList.contains('secondary')).toBe(true)
    expect(acquireCardButton.classList.contains('secondary')).toBe(true)
    expect(claimPointButton.classList.contains('secondary')).toBe(true)
    expect(restButton.classList.contains('secondary')).toBe(true)
  })
})
