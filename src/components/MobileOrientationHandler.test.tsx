/**
 * Unit tests for MobileOrientationHandler component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileOrientationHandler } from './MobileOrientationHandler'
import * as fullscreenUtils from '../utils/fullscreenUtils'

describe('MobileOrientationHandler', () => {
  const originalUserAgent = navigator.userAgent
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight

  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true,
    })
  })

  it('renders children on desktop', () => {
    // Desktop user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      configurable: true,
    })

    render(
      <MobileOrientationHandler>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    expect(screen.getByText('Game Content')).toBeInTheDocument()
    expect(screen.queryByText('Rotate Your Device')).not.toBeInTheDocument()
  })

  it('detects mobile device from user agent', () => {
    // Mobile user agent (iPhone)
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Safari/604.1',
      configurable: true,
    })

    // Portrait mode
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })

    render(
      <MobileOrientationHandler>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    expect(screen.getByText('Rotate Your Device')).toBeInTheDocument()
    expect(screen.queryByText('Game Content')).not.toBeInTheDocument()
  })

  it('shows orientation prompt in portrait mode on mobile', () => {
    // Android user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) Chrome/91.0',
      configurable: true,
    })

    // Portrait mode (height > width)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 640,
    })

    render(
      <MobileOrientationHandler>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    expect(screen.getByText('Rotate Your Device')).toBeInTheDocument()
    expect(screen.getByText(/please rotate your device to landscape mode/i)).toBeInTheDocument()
  })

  it('renders children in landscape mode on mobile', () => {
    // Mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Safari/604.1',
      configurable: true,
    })

    // Landscape mode (width > height)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 667,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(
      <MobileOrientationHandler>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    expect(screen.getByText('Game Content')).toBeInTheDocument()
    expect(screen.queryByText('Rotate Your Device')).not.toBeInTheDocument()
  })

  it('shows start game button when onStartGame is provided', () => {
    // Mobile user agent in portrait
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) Safari/604.1',
      configurable: true,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const onStartGame = vi.fn()

    render(
      <MobileOrientationHandler onStartGame={onStartGame}>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    const startButton = screen.getByText('Start Game')
    expect(startButton).toBeInTheDocument()
  })

  it('shows start game button even when onStartGame is not provided', () => {
    // Mobile user agent in portrait
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Android; Mobile) Chrome/91.0',
      configurable: true,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 640,
    })

    render(
      <MobileOrientationHandler>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    // Button is always shown now, even without onStartGame callback
    expect(screen.getByText('Start Game')).toBeInTheDocument()
  })

  it('detects various mobile user agents', () => {
    const mobileUserAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) Safari/604.1',
      'Mozilla/5.0 (Linux; Android 10) Chrome/91.0',
      'Mozilla/5.0 (Linux; Android 10; SM-G960F) Chrome/91.0',
      'Opera/9.80 (Android; Opera Mini/7.5.33361/191.273) Presto/2.12.423',
    ]

    mobileUserAgents.forEach((userAgent) => {
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgent,
        configurable: true,
      })

      // Portrait mode
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      const { unmount } = render(
        <MobileOrientationHandler>
          <div>Game Content</div>
        </MobileOrientationHandler>
      )

      expect(screen.getByText('Rotate Your Device')).toBeInTheDocument()
      unmount()
    })
  })

  it('calls enterGameMode when start button is clicked', async () => {
    // Mobile user agent in portrait
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Safari/604.1',
      configurable: true,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })

    const onStartGame = vi.fn()
    const enterGameModeSpy = vi.spyOn(fullscreenUtils, 'enterGameMode').mockResolvedValue({
      fullscreenSuccess: true,
      orientationSuccess: true,
    })

    render(
      <MobileOrientationHandler onStartGame={onStartGame}>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    const startButton = screen.getByText('Start Game')
    await userEvent.click(startButton)

    await waitFor(() => {
      expect(enterGameModeSpy).toHaveBeenCalled()
      expect(onStartGame).toHaveBeenCalled()
    })

    enterGameModeSpy.mockRestore()
  })

  it('handles enterGameMode failure gracefully', async () => {
    // Mobile user agent in portrait
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Android; Mobile) Chrome/91.0',
      configurable: true,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 640,
    })

    const onStartGame = vi.fn()
    const enterGameModeSpy = vi.spyOn(fullscreenUtils, 'enterGameMode').mockResolvedValue({
      fullscreenSuccess: false,
      orientationSuccess: false,
    })

    render(
      <MobileOrientationHandler onStartGame={onStartGame}>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    const startButton = screen.getByText('Start Game')
    await userEvent.click(startButton)

    await waitFor(() => {
      expect(enterGameModeSpy).toHaveBeenCalled()
      expect(onStartGame).toHaveBeenCalled()
    })

    enterGameModeSpy.mockRestore()
  })

  it('shows "Starting..." text while processing', async () => {
    // Mobile user agent in portrait
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) Safari/604.1',
      configurable: true,
    })

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    let resolveEnterGameMode: (value: any) => void
    const enterGameModePromise = new Promise((resolve) => {
      resolveEnterGameMode = resolve
    })

    const enterGameModeSpy = vi
      .spyOn(fullscreenUtils, 'enterGameMode')
      .mockReturnValue(enterGameModePromise as any)

    render(
      <MobileOrientationHandler onStartGame={vi.fn()}>
        <div>Game Content</div>
      </MobileOrientationHandler>
    )

    const startButton = screen.getByText('Start Game')
    await userEvent.click(startButton)

    expect(screen.getByText('Starting...')).toBeInTheDocument()
    expect(startButton).toBeDisabled()

    // Resolve the promise
    resolveEnterGameMode!({
      fullscreenSuccess: true,
      orientationSuccess: true,
    })

    await waitFor(() => {
      expect(screen.queryByText('Starting...')).not.toBeInTheDocument()
    })

    enterGameModeSpy.mockRestore()
  })
})
