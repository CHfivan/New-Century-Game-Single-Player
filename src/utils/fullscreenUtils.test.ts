/**
 * Tests for fullscreen and orientation utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  requestFullscreen,
  lockOrientationLandscape,
  unlockOrientation,
  exitFullscreen,
  isFullscreen,
  enterGameMode,
} from './fullscreenUtils'

describe('fullscreenUtils', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('requestFullscreen', () => {
    it('should request fullscreen using standard API', async () => {
      const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: mockRequestFullscreen,
        writable: true,
        configurable: true,
      })

      const result = await requestFullscreen()

      expect(result).toBe(true)
      expect(mockRequestFullscreen).toHaveBeenCalled()
    })

    it('should return false if fullscreen API is not supported', async () => {
      // Remove all fullscreen methods
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await requestFullscreen()

      expect(result).toBe(false)
    })

    it('should return false if fullscreen request fails', async () => {
      const mockRequestFullscreen = vi.fn().mockRejectedValue(new Error('Permission denied'))
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: mockRequestFullscreen,
        writable: true,
        configurable: true,
      })

      const result = await requestFullscreen()

      expect(result).toBe(false)
    })
  })

  describe('lockOrientationLandscape', () => {
    it('should lock orientation using standard API', async () => {
      const mockLock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(screen, 'orientation', {
        value: { lock: mockLock },
        writable: true,
        configurable: true,
      })

      const result = await lockOrientationLandscape()

      expect(result).toBe(true)
      expect(mockLock).toHaveBeenCalledWith('landscape')
    })

    it('should return false if orientation API is not supported', async () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await lockOrientationLandscape()

      expect(result).toBe(false)
    })

    it('should return false if orientation lock fails', async () => {
      const mockLock = vi.fn().mockRejectedValue(new Error('Lock failed'))
      Object.defineProperty(screen, 'orientation', {
        value: { lock: mockLock },
        writable: true,
        configurable: true,
      })

      const result = await lockOrientationLandscape()

      expect(result).toBe(false)
    })
  })

  describe('unlockOrientation', () => {
    it('should unlock orientation using standard API', () => {
      const mockUnlock = vi.fn()
      Object.defineProperty(screen, 'orientation', {
        value: { unlock: mockUnlock },
        writable: true,
        configurable: true,
      })

      unlockOrientation()

      expect(mockUnlock).toHaveBeenCalled()
    })

    it('should not throw if orientation API is not supported', () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(() => unlockOrientation()).not.toThrow()
    })
  })

  describe('exitFullscreen', () => {
    it('should exit fullscreen using standard API', async () => {
      const mockExitFullscreen = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(document, 'exitFullscreen', {
        value: mockExitFullscreen,
        writable: true,
        configurable: true,
      })

      await exitFullscreen()

      expect(mockExitFullscreen).toHaveBeenCalled()
    })

    it('should not throw if exitFullscreen fails', async () => {
      const mockExitFullscreen = vi.fn().mockRejectedValue(new Error('Exit failed'))
      Object.defineProperty(document, 'exitFullscreen', {
        value: mockExitFullscreen,
        writable: true,
        configurable: true,
      })

      await expect(exitFullscreen()).resolves.not.toThrow()
    })
  })

  describe('isFullscreen', () => {
    it('should return true when in fullscreen mode', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      })

      expect(isFullscreen()).toBe(true)
    })

    it('should return false when not in fullscreen mode', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      })

      expect(isFullscreen()).toBe(false)
    })
  })

  describe('enterGameMode', () => {
    it('should request fullscreen and lock orientation', async () => {
      const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined)
      const mockLock = vi.fn().mockResolvedValue(undefined)

      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: mockRequestFullscreen,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(screen, 'orientation', {
        value: { lock: mockLock },
        writable: true,
        configurable: true,
      })

      const result = await enterGameMode()

      expect(result.fullscreenSuccess).toBe(true)
      expect(result.orientationSuccess).toBe(true)
      expect(mockRequestFullscreen).toHaveBeenCalled()
      expect(mockLock).toHaveBeenCalledWith('landscape')
    })

    it('should return false for both if APIs are not supported', async () => {
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await enterGameMode()

      expect(result.fullscreenSuccess).toBe(false)
      expect(result.orientationSuccess).toBe(false)
    })
  })
})
