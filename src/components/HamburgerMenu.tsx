/**
 * HamburgerMenu component
 * Displays hamburger icon at top right with overlay menu
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import './HamburgerMenu.css'

interface HamburgerMenuProps {
  onShowRules?: () => void
  onRestartGame?: () => void
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onShowRules,
  onRestartGame,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Return focus to the hamburger button when menu closes
    toggleRef.current?.focus()
  }, [])

  // Focus trap: keep focus within the menu when open
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const focusableElements = menu.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus the first element when menu opens
    firstFocusable?.focus()

    const handleTrapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    menu.addEventListener('keydown', handleTrapFocus)
    return () => menu.removeEventListener('keydown', handleTrapFocus)
  }, [isOpen, handleClose])

  const handleRules = () => {
    handleClose()
    onShowRules?.()
  }

  const handleRestart = () => {
    handleClose()
    onRestartGame?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      handleClose()
    }
  }

  return (
    <>
      {/* Hamburger Icon */}
      <button
        ref={toggleRef}
        className="hamburger-icon"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="hamburger-menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Overlay Menu */}
      {isOpen && (
        <div
          className="hamburger-overlay"
          onClick={handleClose}
          role="presentation"
        >
          <div
            ref={menuRef}
            id="hamburger-menu"
            className="hamburger-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Game menu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="hamburger-close"
              onClick={handleClose}
              aria-label="Close menu"
            >
              ✕
            </button>

            {/* Menu Title */}
            <h2 className="hamburger-title">Menu</h2>

            {/* Menu Options */}
            <div className="hamburger-options">
              <button
                className="hamburger-option"
                onClick={handleRules}
                aria-label="View game rules"
              >
                📖 Game Rules
              </button>
              <button
                className="hamburger-option"
                onClick={handleRestart}
                aria-label="Restart game"
              >
                🔄 Restart Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
