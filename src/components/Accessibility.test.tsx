/**
 * Accessibility tests for Century Spice Road game components
 * Tests keyboard navigation, ARIA labels, and accessible interactions
 * Validates: Requirements 18.1, 18.2, 18.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButtons } from './ActionButtons'
import { HamburgerMenu } from './HamburgerMenu'
import { PlayerHand } from './PlayerHand'
import { MerchantCardRow } from './MerchantCardRow'
import { PointCardRow } from './PointCardRow'
import { CaravanGrid } from './CaravanGrid'
import { ConversionDialog, ExchangeDialog, DiscardDialog } from './ActionDialog'
import { OpponentPanel } from './OpponentPanel'
import type { MerchantCard, PointCard, Player, SpiceCollection } from '../types'

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockMerchantCards: MerchantCard[] = [
  {
    id: 'spice_2yellow',
    type: 'spice',
    effect: { spices: { yellow: 2, red: 0, green: 0, brown: 0 } },
    imageUrl: '/assets/cards/merchant/merchant_1.PNG',
  },
  {
    id: 'upgrade_2',
    type: 'conversion',
    effect: { upgrades: 2 },
    imageUrl: '/assets/cards/merchant/merchant_2.PNG',
  },
]

const mockPointCards: PointCard[] = [
  {
    id: 'vp_1',
    requiredSpices: { yellow: 0, red: 2, green: 1, brown: 0 },
    points: 8,
    imageUrl: '/assets/cards/point/VP_1.PNG',
  },
  {
    id: 'vp_2',
    requiredSpices: { yellow: 3, red: 0, green: 0, brown: 1 },
    points: 10,
    imageUrl: '/assets/cards/point/VP_2.png',
  },
]

const emptyStats = {
  cubesGained: { yellow: 0, red: 0, green: 0, brown: 0 },
  cubesSpent: { yellow: 0, red: 0, green: 0, brown: 0 },
  merchantCardsPlayed: 0,
  merchantCardsAcquired: 0,
  restActionsTaken: 0,
  cardUsageCount: new Map<string, number>(),
  pointProgression: [],
  turnTimings: [],
  turnStartTime: null,
}

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alice',
  isAI: true,
  caravan: { yellow: 3, red: 1, green: 0, brown: 0 },
  hand: [mockMerchantCards[0]],
  playedCards: [],
  pointCards: [],
  coins: { gold: 0, silver: 0 },
  score: 0,
  statistics: emptyStats,
  ...overrides,
})


// ─── 1. ActionButtons Accessibility ───────────────────────────────────────────

describe('ActionButtons accessibility', () => {
  const handlers = {
    onPlayCard: vi.fn(),
    onAcquireCard: vi.fn(),
    onClaimPoint: vi.fn(),
    onRest: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('has role="toolbar" on the container', () => {
    render(<ActionButtons {...handlers} />)
    expect(screen.getByRole('toolbar')).toBeDefined()
  })

  it('all buttons have aria-labels', () => {
    render(<ActionButtons {...handlers} />)
    expect(screen.getByLabelText('Play a card from your hand')).toBeDefined()
    expect(screen.getByLabelText('Acquire a merchant card')).toBeDefined()
    expect(screen.getByLabelText('Claim a point card')).toBeDefined()
    expect(screen.getByLabelText('Return played cards to hand')).toBeDefined()
  })

  it('error message has role="alert" and aria-live="assertive"', () => {
    const onDismiss = vi.fn()
    render(
      <ActionButtons {...handlers} errorMessage="Not enough spices" onErrorDismiss={onDismiss} />
    )
    const alert = screen.getByRole('alert')
    expect(alert).toBeDefined()
    expect(alert.getAttribute('aria-live')).toBe('assertive')
  })

  it('error message is keyboard dismissible via Enter', () => {
    const onDismiss = vi.fn()
    render(
      <ActionButtons {...handlers} errorMessage="Invalid action" onErrorDismiss={onDismiss} />
    )
    const alert = screen.getByRole('alert')
    fireEvent.keyDown(alert, { key: 'Enter' })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('error message is keyboard dismissible via Space', () => {
    const onDismiss = vi.fn()
    render(
      <ActionButtons {...handlers} errorMessage="Invalid action" onErrorDismiss={onDismiss} />
    )
    const alert = screen.getByRole('alert')
    fireEvent.keyDown(alert, { key: ' ' })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('disabled buttons have descriptive aria-labels', () => {
    render(<ActionButtons {...handlers} disabled />)
    expect(screen.getByLabelText('Play Card - not your turn')).toBeDefined()
    expect(screen.getByLabelText('Acquire Card - not your turn')).toBeDefined()
    expect(screen.getByLabelText('Claim Point - not your turn')).toBeDefined()
    expect(screen.getByLabelText('Rest - not your turn')).toBeDefined()
  })
})

// ─── 2. HamburgerMenu Accessibility ──────────────────────────────────────────

describe('HamburgerMenu accessibility', () => {
  it('toggle button has aria-expanded, aria-haspopup, and aria-controls', () => {
    render(<HamburgerMenu />)
    const toggle = screen.getByLabelText('Open menu')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-haspopup')).toBe('true')
    expect(toggle.getAttribute('aria-controls')).toBe('hamburger-menu')
  })

  it('menu dialog has role="dialog" and aria-modal', () => {
    render(<HamburgerMenu />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeDefined()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('Escape key closes the menu', () => {
    render(<HamburgerMenu />)
    const toggle = screen.getByLabelText('Open menu')
    fireEvent.click(toggle)
    expect(screen.getByRole('dialog')).toBeDefined()

    // Press Escape on the toggle button (which has the keyDown handler)
    fireEvent.keyDown(toggle, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('focus trap cycles Tab within menu', () => {
    render(<HamburgerMenu />)
    fireEvent.click(screen.getByLabelText('Open menu'))

    const menu = document.querySelector('#hamburger-menu')!
    const focusable = menu.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    // Focus the last element, then Tab should wrap to first
    last.focus()
    fireEvent.keyDown(menu, { key: 'Tab' })
    // After the handler, focus should be on the first element
    expect(document.activeElement).toBe(first)
  })

  it('aria-expanded updates when menu opens', () => {
    render(<HamburgerMenu />)
    const toggle = screen.getByLabelText('Open menu')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})


// ─── 3. PlayerHand Accessibility ─────────────────────────────────────────────

describe('PlayerHand accessibility', () => {
  it('cards have role="listitem" and tabIndex', () => {
    const { container } = render(<PlayerHand cards={mockMerchantCards} />)
    const items = container.querySelectorAll('[role="listitem"]')
    expect(items.length).toBe(2)
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('0')
    })
  })

  it('disabled cards have tabIndex=-1', () => {
    const { container } = render(<PlayerHand cards={mockMerchantCards} disabled />)
    const items = container.querySelectorAll('[role="listitem"]')
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('-1')
    })
  })

  it('cards respond to Enter keydown', () => {
    const onClick = vi.fn()
    const { container } = render(<PlayerHand cards={mockMerchantCards} onCardClick={onClick} />)
    const firstCard = container.querySelector('[role="listitem"]')!
    fireEvent.keyDown(firstCard, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(mockMerchantCards[0], 0)
  })

  it('cards respond to Space keydown', () => {
    const onClick = vi.fn()
    const { container } = render(<PlayerHand cards={mockMerchantCards} onCardClick={onClick} />)
    const firstCard = container.querySelector('[role="listitem"]')!
    fireEvent.keyDown(firstCard, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('cards have descriptive aria-labels', () => {
    render(<PlayerHand cards={mockMerchantCards} />)
    expect(screen.getByLabelText(/Merchant card 1 of 2/)).toBeDefined()
    expect(screen.getByLabelText(/Merchant card 2 of 2/)).toBeDefined()
  })
})

// ─── 4. MerchantCardRow Accessibility ────────────────────────────────────────

describe('MerchantCardRow accessibility', () => {
  it('cards have role="listitem" and tabIndex=0', () => {
    const { container } = render(<MerchantCardRow cards={mockMerchantCards} />)
    const items = container.querySelectorAll('[role="listitem"]')
    expect(items.length).toBe(2)
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('0')
    })
  })

  it('cards have aria-label with cost info', () => {
    render(<MerchantCardRow cards={mockMerchantCards} />)
    // First card (index 0) is free
    expect(screen.getByLabelText(/free to acquire/)).toBeDefined()
    // Second card (index 1) costs 1 spice
    expect(screen.getByLabelText(/costs 1 spice to acquire/)).toBeDefined()
  })

  it('cards respond to Enter keydown', () => {
    const onClick = vi.fn()
    const { container } = render(<MerchantCardRow cards={mockMerchantCards} onCardClick={onClick} />)
    const firstCard = container.querySelector('[role="listitem"]')!
    fireEvent.keyDown(firstCard, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(mockMerchantCards[0], 0)
  })

  it('cards respond to Space keydown', () => {
    const onClick = vi.fn()
    const { container } = render(<MerchantCardRow cards={mockMerchantCards} onCardClick={onClick} />)
    const secondCard = container.querySelectorAll('[role="listitem"]')[1]!
    fireEvent.keyDown(secondCard, { key: ' ' })
    expect(onClick).toHaveBeenCalledWith(mockMerchantCards[1], 1)
  })

  it('disabled cards have tabIndex=-1', () => {
    const { container } = render(<MerchantCardRow cards={mockMerchantCards} disabled />)
    const items = container.querySelectorAll('[role="listitem"]')
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('-1')
    })
  })
})

// ─── 5. PointCardRow Accessibility ───────────────────────────────────────────

describe('PointCardRow accessibility', () => {
  it('cards have role="listitem" and tabIndex=0', () => {
    const { container } = render(
      <PointCardRow cards={mockPointCards} goldCoins={5} silverCoins={10} />
    )
    const items = container.querySelectorAll('[role="listitem"]')
    expect(items.length).toBe(2)
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('0')
    })
  })

  it('cards have aria-label with VP info', () => {
    render(<PointCardRow cards={mockPointCards} goldCoins={5} silverCoins={10} />)
    expect(screen.getByLabelText(/8 victory points/)).toBeDefined()
    expect(screen.getByLabelText(/10 victory points/)).toBeDefined()
  })

  it('cards respond to Enter keydown', () => {
    const onClick = vi.fn()
    const { container } = render(
      <PointCardRow cards={mockPointCards} goldCoins={5} silverCoins={10} onCardClick={onClick} />
    )
    const firstCard = container.querySelector('[role="listitem"]')!
    fireEvent.keyDown(firstCard, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledWith(mockPointCards[0], 0)
  })

  it('cards respond to Space keydown', () => {
    const onClick = vi.fn()
    const { container } = render(
      <PointCardRow cards={mockPointCards} goldCoins={5} silverCoins={10} onCardClick={onClick} />
    )
    const secondCard = container.querySelectorAll('[role="listitem"]')[1]!
    fireEvent.keyDown(secondCard, { key: ' ' })
    expect(onClick).toHaveBeenCalledWith(mockPointCards[1], 1)
  })

  it('disabled cards have tabIndex=-1', () => {
    const { container } = render(
      <PointCardRow cards={mockPointCards} goldCoins={5} silverCoins={10} disabled />
    )
    const items = container.querySelectorAll('[role="listitem"]')
    items.forEach((item) => {
      expect(item.getAttribute('tabindex')).toBe('-1')
    })
  })
})


// ─── 6. CaravanGrid Accessibility ────────────────────────────────────────────

describe('CaravanGrid accessibility', () => {
  const caravan: SpiceCollection = { yellow: 2, red: 1, green: 0, brown: 0 }

  it('has role="grid"', () => {
    render(<CaravanGrid caravan={caravan} />)
    expect(screen.getByRole('grid')).toBeDefined()
  })

  it('boxes have role="gridcell"', () => {
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const cells = container.querySelectorAll('[role="gridcell"]')
    expect(cells.length).toBe(10)
  })

  it('clickable boxes have tabIndex=0 and respond to Enter/Space', () => {
    const onCubeClick = vi.fn()
    const { container } = render(
      <CaravanGrid caravan={caravan} onCubeClick={onCubeClick} />
    )
    // Filled, clickable cells should have tabIndex=0
    const clickableCells = container.querySelectorAll('[role="gridcell"][tabindex="0"]')
    expect(clickableCells.length).toBe(3) // 2 yellow + 1 red

    // Enter key
    fireEvent.keyDown(clickableCells[0], { key: 'Enter' })
    expect(onCubeClick).toHaveBeenCalledTimes(1)

    // Space key
    fireEvent.keyDown(clickableCells[1], { key: ' ' })
    expect(onCubeClick).toHaveBeenCalledTimes(2)
  })

  it('non-clickable boxes have tabIndex=-1', () => {
    const { container } = render(<CaravanGrid caravan={caravan} />)
    // Without onCubeClick, all cells should be tabIndex=-1
    const cells = container.querySelectorAll('[role="gridcell"]')
    cells.forEach((cell) => {
      expect(cell.getAttribute('tabindex')).toBe('-1')
    })
  })

  it('cells have descriptive aria-labels', () => {
    render(<CaravanGrid caravan={caravan} />)
    expect(screen.getByLabelText('yellow spice cube, slot 1')).toBeDefined()
    expect(screen.getByLabelText('yellow spice cube, slot 2')).toBeDefined()
    expect(screen.getByLabelText('red spice cube, slot 3')).toBeDefined()
    expect(screen.getByLabelText('Empty slot 4')).toBeDefined()
  })
})

// ─── 7. ActionDialog Accessibility ───────────────────────────────────────────

describe('ConversionDialog accessibility', () => {
  const conversionCard: MerchantCard = {
    id: 'upgrade_2',
    type: 'conversion',
    effect: { upgrades: 2 },
    imageUrl: '/test.png',
  }
  const caravan: SpiceCollection = { yellow: 2, red: 1, green: 0, brown: 0 }

  it('dialog has role="dialog" and aria-modal', () => {
    render(
      <ConversionDialog card={conversionCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeDefined()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('Escape key dismisses the dialog', () => {
    const onCancel = vi.fn()
    render(
      <ConversionDialog card={conversionCard} caravan={caravan} onConfirm={vi.fn()} onCancel={onCancel} />
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('options have role="radio" with aria-checked', () => {
    const { container } = render(
      <ConversionDialog card={conversionCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const radios = container.querySelectorAll('[role="radio"]')
    expect(radios.length).toBeGreaterThan(0)
    // Initially none selected
    radios.forEach((radio) => {
      expect(radio.getAttribute('aria-checked')).toBe('false')
    })
    // Click first option
    fireEvent.click(radios[0])
    expect(radios[0].getAttribute('aria-checked')).toBe('true')
  })

  it('Cancel and Confirm buttons have aria-labels', () => {
    render(
      <ConversionDialog card={conversionCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByLabelText('Cancel upgrade')).toBeDefined()
    expect(screen.getByLabelText('Confirm upgrade')).toBeDefined()
  })
})

describe('ExchangeDialog accessibility', () => {
  const exchangeCard: MerchantCard = {
    id: 'exchange_2y_1r',
    type: 'exchange',
    effect: {
      input: { yellow: 2, red: 0, green: 0, brown: 0 },
      output: { yellow: 0, red: 1, green: 0, brown: 0 },
    },
    imageUrl: '/test.png',
  }
  const caravan: SpiceCollection = { yellow: 4, red: 0, green: 0, brown: 0 }

  it('dialog has role="dialog" and aria-modal', () => {
    render(
      <ExchangeDialog card={exchangeCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('Escape key dismisses the dialog', () => {
    const onCancel = vi.fn()
    render(
      <ExchangeDialog card={exchangeCard} caravan={caravan} onConfirm={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('options have role="radio" with aria-checked', () => {
    const { container } = render(
      <ExchangeDialog card={exchangeCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const radios = container.querySelectorAll('[role="radio"]')
    expect(radios.length).toBeGreaterThan(0)
    fireEvent.click(radios[0])
    expect(radios[0].getAttribute('aria-checked')).toBe('true')
  })

  it('Cancel and Confirm buttons have aria-labels', () => {
    render(
      <ExchangeDialog card={exchangeCard} caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByLabelText('Cancel exchange')).toBeDefined()
    expect(screen.getByLabelText('Confirm exchange')).toBeDefined()
  })
})

describe('DiscardDialog accessibility', () => {
  // Caravan with 12 spices (must discard 2)
  const caravan: SpiceCollection = { yellow: 5, red: 4, green: 2, brown: 1 }

  it('dialog has role="dialog" and aria-modal', () => {
    render(
      <DiscardDialog caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('Escape key dismisses the dialog', () => {
    const onCancel = vi.fn()
    render(
      <DiscardDialog caravan={caravan} onConfirm={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cubes have role="checkbox" with aria-checked', () => {
    const { container } = render(
      <DiscardDialog caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    const checkboxes = container.querySelectorAll('[role="checkbox"]')
    expect(checkboxes.length).toBe(12) // 5+4+2+1
    // Initially none checked
    checkboxes.forEach((cb) => {
      expect(cb.getAttribute('aria-checked')).toBe('false')
    })
    // Click first cube
    fireEvent.click(checkboxes[0])
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true')
  })

  it('Cancel and Confirm buttons have aria-labels', () => {
    render(
      <DiscardDialog caravan={caravan} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByLabelText('Cancel and undo action')).toBeDefined()
    expect(screen.getByLabelText('Confirm discard')).toBeDefined()
  })
})


// ─── 8. OpponentPanel Accessibility ──────────────────────────────────────────

describe('OpponentPanel accessibility', () => {
  const opponents: Player[] = [
    makePlayer({ id: 'ai1', name: 'Bot 1', playedCards: [mockMerchantCards[0]] }),
    makePlayer({ id: 'ai2', name: 'Bot 2', playedCards: [] }),
  ]

  it('played cards count has role="button" and tabIndex=0', () => {
    const { container } = render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" />
    )
    const playedCardsButtons = container.querySelectorAll('.played-cards[role="button"]')
    expect(playedCardsButtons.length).toBe(2)
    playedCardsButtons.forEach((btn) => {
      expect(btn.getAttribute('tabindex')).toBe('0')
    })
  })

  it('played cards count responds to Enter key', () => {
    const onPlayedCardsClick = vi.fn()
    const { container } = render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" onPlayedCardsClick={onPlayedCardsClick} />
    )
    const playedCardsBtn = container.querySelector('.played-cards[role="button"]')!
    fireEvent.keyDown(playedCardsBtn, { key: 'Enter' })
    expect(onPlayedCardsClick).toHaveBeenCalledWith('ai1')
  })

  it('played cards count responds to Space key', () => {
    const onPlayedCardsClick = vi.fn()
    const { container } = render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" onPlayedCardsClick={onPlayedCardsClick} />
    )
    const playedCardsBtn = container.querySelector('.played-cards[role="button"]')!
    fireEvent.keyDown(playedCardsBtn, { key: ' ' })
    expect(onPlayedCardsClick).toHaveBeenCalledWith('ai1')
  })

  it('played cards button has descriptive aria-label', () => {
    render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" />
    )
    expect(screen.getByLabelText(/View Bot 1's 1 played cards/)).toBeDefined()
    expect(screen.getByLabelText(/View Bot 2's 0 played cards/)).toBeDefined()
  })

  it('panel has role="complementary" with aria-label', () => {
    const { container } = render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" />
    )
    const panel = container.querySelector('[role="complementary"]')
    expect(panel).toBeDefined()
    expect(panel!.getAttribute('aria-label')).toBe('Opponent information panel')
  })

  it('toggle button has descriptive aria-label', () => {
    render(
      <OpponentPanel opponents={opponents} currentPlayerId="ai1" />
    )
    expect(screen.getByLabelText('Collapse panel')).toBeDefined()
  })
})
