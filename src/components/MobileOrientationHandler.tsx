/**
 * MobileOrientationHandler component
 * Detects mobile devices and prompts for landscape orientation
 */

import React, { useState, useEffect } from 'react'
import { enterGameMode } from '../utils/fullscreenUtils'
import './MobileOrientationHandler.css'

interface MobileOrientationHandlerProps {
  children: React.ReactNode
  onStartGame?: () => void
}

/**
 * Detect if device is mobile based on user agent
 */
const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
  // Check for mobile devices
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  )
}

/**
 * Check current orientation
 */
const isPortrait = (): boolean => {
  return window.innerHeight > window.innerWidth
}

export const MobileOrientationHandler: React.FC<MobileOrientationHandlerProps> = ({
  children,
  onStartGame,
}) => {
  const [isMobile] = useState(isMobileDevice())
  const [showPrompt, setShowPrompt] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    isPortrait() ? 'portrait' : 'landscape'
  )
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      return
    }

    // Update orientation on resize
    const handleOrientationChange = () => {
      const newOrientation = isPortrait() ? 'portrait' : 'landscape'
      setOrientation(newOrientation)
      setShowPrompt(newOrientation === 'portrait')
    }

    // Initial check
    handleOrientationChange()

    // Listen for orientation changes
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [isMobile])

  /**
   * Handle start game button click
   * Requests fullscreen and locks orientation
   */
  const handleStartGame = async () => {
    setIsStarting(true)

    try {
      const { fullscreenSuccess, orientationSuccess } = await enterGameMode()

      // Log results for debugging
      if (!fullscreenSuccess) {
        console.warn('Fullscreen request failed or not supported')
      }
      if (!orientationSuccess) {
        console.warn('Orientation lock failed or not supported')
      }

      // Call custom onStartGame callback if provided
      if (onStartGame) {
        onStartGame()
      }

      // Hide prompt after attempting to enter game mode
      // Even if APIs fail, user can still play in current orientation
      setShowPrompt(false)
    } catch (error) {
      console.error('Error starting game:', error)
    } finally {
      setIsStarting(false)
    }
  }

  // If not mobile, just render children
  if (!isMobile) {
    return <>{children}</>
  }

  // If mobile and portrait, show orientation prompt
  if (showPrompt && orientation === 'portrait') {
    return (
      <div className="orientation-prompt">
        <div className="orientation-prompt-content">
          <div className="orientation-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M12 18h.01" />
            </svg>
            <svg
              className="rotate-arrow"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </div>
          <h2>Rotate Your Device</h2>
          <p>
            For the best experience, please rotate your device to landscape mode.
          </p>
          <button
            className="start-game-button"
            onClick={handleStartGame}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      </div>
    )
  }

  // Mobile in landscape, render children
  return <>{children}</>
}
