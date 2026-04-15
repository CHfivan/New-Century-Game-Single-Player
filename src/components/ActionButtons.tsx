/**
 * ActionButtons component
 * Displays 4 action buttons for game actions
 * Requirement 7.9: disable invalid actions and show error messages
 */

import React from 'react'
import './ActionButtons.css'

interface ActionButtonsProps {
  onPlayCard: () => void
  onAcquireCard: () => void
  onClaimPoint: () => void
  onRest: () => void
  disabled?: boolean
  playCardDisabled?: boolean
  acquireCardDisabled?: boolean
  claimPointDisabled?: boolean
  restDisabled?: boolean
  /** Error message to display below the buttons */
  errorMessage?: string | null
  /** Called when the user dismisses the error */
  onErrorDismiss?: () => void
}

export const ActionButtons: React.FC<ActionButtonsProps> = React.memo(({
  onPlayCard,
  onAcquireCard,
  onClaimPoint,
  onRest,
  disabled = false,
  playCardDisabled = false,
  acquireCardDisabled = false,
  claimPointDisabled = false,
  restDisabled = false,
  errorMessage,
  onErrorDismiss,
}) => {
  return (
    <div className="action-buttons" role="toolbar" aria-label="Game actions">
      <button
        className="action-btn secondary"
        onClick={onPlayCard}
        disabled={disabled || playCardDisabled}
        aria-label={
          disabled
            ? 'Play Card - not your turn'
            : playCardDisabled
            ? 'Play Card - no cards available to play'
            : 'Play a card from your hand'
        }
        title={
          disabled
            ? 'Not your turn'
            : playCardDisabled
            ? 'No cards available to play'
            : 'Play a card from your hand'
        }
      >
        Play Card
      </button>

      <button
        className="action-btn secondary"
        onClick={onAcquireCard}
        disabled={disabled || acquireCardDisabled}
        aria-label={
          disabled
            ? 'Acquire Card - not your turn'
            : acquireCardDisabled
            ? 'Acquire Card - cannot acquire a card'
            : 'Acquire a merchant card'
        }
        title={
          disabled
            ? 'Not your turn'
            : acquireCardDisabled
            ? 'Cannot acquire a card'
            : 'Acquire a merchant card'
        }
      >
        Acquire Card
      </button>

      <button
        className="action-btn secondary"
        onClick={onClaimPoint}
        disabled={disabled || claimPointDisabled}
        aria-label={
          disabled
            ? 'Claim Point - not your turn'
            : claimPointDisabled
            ? 'Claim Point - not enough spices'
            : 'Claim a point card'
        }
        title={
          disabled
            ? 'Not your turn'
            : claimPointDisabled
            ? 'Not enough spices to claim any point card'
            : 'Claim a point card'
        }
      >
        Claim Point
      </button>

      <button
        className="action-btn secondary"
        onClick={onRest}
        disabled={disabled || restDisabled}
        aria-label={
          disabled
            ? 'Rest - not your turn'
            : restDisabled
            ? 'Rest - no played cards to rest'
            : 'Return played cards to hand'
        }
        title={
          disabled
            ? 'Not your turn'
            : restDisabled
            ? 'No played cards to rest'
            : 'Return played cards to hand'
        }
      >
        Rest
      </button>

      {errorMessage && (
        <div
          className="action-error-message"
          onClick={onErrorDismiss}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onErrorDismiss?.() } }}
          title="Click to dismiss"
          role="alert"
          aria-live="assertive"
          tabIndex={0}
        >
          ⚠ {errorMessage}
        </div>
      )}
    </div>
  )
})
