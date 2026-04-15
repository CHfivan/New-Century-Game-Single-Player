/**
 * Custom hook for error feedback animations
 */

import { useSpring } from '@react-spring/web'
import { errorAnimationConfig, shakeConfig, shakeSequence } from './errorAnimations'

export const useErrorAnimation = (hasError: boolean) => {
  // Error highlight animation
  const errorStyle = useSpring({
    backgroundColor: hasError ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
    borderColor: hasError ? '#DC2626' : 'transparent',
    config: errorAnimationConfig,
  })

  return errorStyle
}

export const useShakeAnimation = (trigger: boolean) => {
  // Shake animation
  const shakeStyle = useSpring({
    from: { x: 0 },
    to: trigger ? shakeSequence : [{ x: 0 }],
    config: shakeConfig,
    reset: trigger,
  })

  return shakeStyle
}
