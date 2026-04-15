import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HamburgerMenu } from './HamburgerMenu'

describe('HamburgerMenu', () => {
  it('renders hamburger icon', () => {
    render(<HamburgerMenu />)
    const button = screen.getByLabelText('Open menu')
    expect(button).toBeDefined()
    expect(button.classList.contains('hamburger-icon')).toBe(true)
  })

  it('opens menu overlay when hamburger icon is clicked', () => {
    render(<HamburgerMenu />)
    const button = screen.getByLabelText('Open menu')
    
    // Menu should not be visible initially
    expect(screen.queryByRole('dialog')).toBeNull()
    
    // Click to open
    fireEvent.click(button)
    
    // Menu should now be visible
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('closes menu when close button is clicked', () => {
    render(<HamburgerMenu />)
    
    // Open menu
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByRole('dialog')).toBeDefined()
    
    // Close menu via the X button inside the dialog
    const closeButtons = screen.getAllByLabelText('Close menu')
    const dialogCloseBtn = closeButtons.find(el => el.classList.contains('hamburger-close'))!
    fireEvent.click(dialogCloseBtn)
    
    // Menu should be closed
    expect(screen.queryByText('Game Rules')).toBeNull()
  })

  it('closes menu when overlay background is clicked', () => {
    render(<HamburgerMenu />)
    
    // Open menu
    fireEvent.click(screen.getByLabelText('Open menu'))
    
    // Click overlay background
    const overlay = document.querySelector('.hamburger-overlay')
    expect(overlay).toBeDefined()
    fireEvent.click(overlay!)
    
    // Menu should be closed
    expect(screen.queryByText('Game Rules')).toBeNull()
  })

  it('does not close menu when menu content is clicked', () => {
    render(<HamburgerMenu />)
    
    // Open menu
    fireEvent.click(screen.getByLabelText('Open menu'))
    
    // Click menu content
    const menuContent = document.querySelector('.hamburger-menu')
    expect(menuContent).toBeDefined()
    fireEvent.click(menuContent!)
    
    // Menu should still be open
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('displays Game Rules option', () => {
    render(<HamburgerMenu />)
    
    // Open menu
    fireEvent.click(screen.getByLabelText('Open menu'))
    
    // Check for Game Rules option
    expect(screen.getByText('📖 Game Rules')).toBeDefined()
  })

  it('displays Restart Game option', () => {
    render(<HamburgerMenu />)
    
    // Open menu
    fireEvent.click(screen.getByLabelText('Open menu'))
    
    // Check for Restart Game option
    expect(screen.getByText('🔄 Restart Game')).toBeDefined()
  })

  it('calls onShowRules when Game Rules is clicked', () => {
    const onShowRules = vi.fn()
    render(<HamburgerMenu onShowRules={onShowRules} />)
    
    // Open menu and click Game Rules
    fireEvent.click(screen.getByLabelText('Open menu'))
    fireEvent.click(screen.getByText('📖 Game Rules'))
    
    expect(onShowRules).toHaveBeenCalledTimes(1)
  })

  it('calls onRestartGame when Restart Game is clicked', () => {
    const onRestartGame = vi.fn()
    render(<HamburgerMenu onRestartGame={onRestartGame} />)
    
    // Open menu and click Restart Game
    fireEvent.click(screen.getByLabelText('Open menu'))
    fireEvent.click(screen.getByText('🔄 Restart Game'))
    
    expect(onRestartGame).toHaveBeenCalledTimes(1)
  })

  it('closes menu after Game Rules is clicked', () => {
    const onShowRules = vi.fn()
    render(<HamburgerMenu onShowRules={onShowRules} />)
    
    // Open menu and click Game Rules
    fireEvent.click(screen.getByLabelText('Open menu'))
    fireEvent.click(screen.getByText('📖 Game Rules'))
    
    // Menu should be closed
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes menu after Restart Game is clicked', () => {
    const onRestartGame = vi.fn()
    render(<HamburgerMenu onRestartGame={onRestartGame} />)
    
    // Open menu and click Restart Game
    fireEvent.click(screen.getByLabelText('Open menu'))
    fireEvent.click(screen.getByText('🔄 Restart Game'))
    
    // Menu should be closed
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('updates aria-expanded attribute when menu opens/closes', () => {
    render(<HamburgerMenu />)
    const button = screen.getByLabelText('Open menu')
    
    // Initially closed
    expect(button.getAttribute('aria-expanded')).toBe('false')
    
    // Open menu — the same button element now has aria-label="Close menu"
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-label')).toBe('Close menu')
    
    // Close menu via the X close button inside the dialog
    const closeButtons = screen.getAllByLabelText('Close menu')
    // The second one is the X button inside the dialog
    const dialogCloseBtn = closeButtons.find(el => el.classList.contains('hamburger-close'))!
    fireEvent.click(dialogCloseBtn)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.getAttribute('aria-label')).toBe('Open menu')
  })
})
