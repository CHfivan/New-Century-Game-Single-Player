/**
 * Fullscreen and Orientation Lock Utilities
 * Handles fullscreen API and screen orientation API with graceful fallbacks
 */

/**
 * Request fullscreen mode
 * Returns true if successful, false otherwise
 */
export const requestFullscreen = async (): Promise<boolean> => {
  try {
    const element = document.documentElement

    // Check if fullscreen API is available
    if (element.requestFullscreen) {
      await element.requestFullscreen()
      return true
    } else if ((element as any).webkitRequestFullscreen) {
      // Safari
      await (element as any).webkitRequestFullscreen()
      return true
    } else if ((element as any).mozRequestFullScreen) {
      // Firefox
      await (element as any).mozRequestFullScreen()
      return true
    } else if ((element as any).msRequestFullscreen) {
      // IE/Edge
      await (element as any).msRequestFullscreen()
      return true
    }

    console.warn('Fullscreen API not supported')
    return false
  } catch (error) {
    console.error('Failed to enter fullscreen:', error)
    return false
  }
}

/**
 * Lock screen orientation to landscape
 * Returns true if successful, false otherwise
 */
export const lockOrientationLandscape = async (): Promise<boolean> => {
  try {
    // Check if Screen Orientation API is available
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape')
      return true
    }

    // Fallback for older browsers
    const lockOrientation =
      (screen as any).lockOrientation ||
      (screen as any).mozLockOrientation ||
      (screen as any).msLockOrientation

    if (lockOrientation) {
      const result = lockOrientation('landscape')
      return result === true
    }

    console.warn('Screen Orientation API not supported')
    return false
  } catch (error) {
    console.error('Failed to lock orientation:', error)
    return false
  }
}

/**
 * Unlock screen orientation
 */
export const unlockOrientation = (): void => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock()
    } else {
      const unlockOrientation =
        (screen as any).unlockOrientation ||
        (screen as any).mozUnlockOrientation ||
        (screen as any).msUnlockOrientation

      if (unlockOrientation) {
        unlockOrientation()
      }
    }
  } catch (error) {
    console.error('Failed to unlock orientation:', error)
  }
}

/**
 * Exit fullscreen mode
 */
export const exitFullscreen = async (): Promise<void> => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen()
    }
  } catch (error) {
    console.error('Failed to exit fullscreen:', error)
  }
}

/**
 * Check if currently in fullscreen mode
 */
export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )
}

/**
 * Request fullscreen and lock orientation to landscape
 * This is the main function to call when starting the game on mobile
 */
export const enterGameMode = async (): Promise<{
  fullscreenSuccess: boolean
  orientationSuccess: boolean
}> => {
  const fullscreenSuccess = await requestFullscreen()
  const orientationSuccess = await lockOrientationLandscape()

  return {
    fullscreenSuccess,
    orientationSuccess,
  }
}
