/**
 * Demo component to showcase the game engine and UI components
 * Implements game flow, turn management, action dialogs, and discard flow
 * Requirements: 12.4, 7.9, 15.1-15.5, 4.2
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { GameProvider, useGame, loadSavedGame } from './state'
import {
  HamburgerMenu,
  PlayerHand,
  OpponentPanel,
  PlayedCardsOverlay,
  GameBoardContainer,
  ActionButtons,
  PlayerCaravan,
  MerchantCardRow,
  PointCardRow,
  PlayerScorePanel,
  MainMenu,
  RulesModal,
} from './components'
import {
  ConversionDialog,
  ExchangeDialog,
  DiscardDialog,
} from './components/ActionDialog'
import { MerchantCard, SpiceCollection, SpiceType, GameAction } from './types/game'
import { isConversionCard, isExchangeCard, isSpiceCard, getTotalSpices, addSpices } from './types'
import { GameEngine } from './engine/GameEngine'
import { useAnimations, AnimationLayer, RowSlideAnimation } from './animations/AnimationLayer'
import './Demo.css'

/** Capture card positions and DOM HTML for row-slide animation before state update */
function captureRowSlide(
  cardSelector: string,
  deckSelector: string,
  removedIndex: number
): RowSlideAnimation | null {
  const cardEls = document.querySelectorAll(cardSelector)
  if (cardEls.length === 0) return null
  const cardRects: { left: number; top: number; width: number; height: number }[] = []
  const cardHtmls: string[] = []
  cardEls.forEach(el => {
    const r = el.getBoundingClientRect()
    cardRects.push({ left: r.left, top: r.top, width: r.width, height: r.height })
    cardHtmls.push(el.outerHTML)
  })
  const deckEl = document.querySelector(deckSelector)
  const deckRect = deckEl ? (() => { const r = deckEl.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } })() : null
  const deckHtml = deckEl?.outerHTML
  // For the new card, we can't capture it yet (it doesn't exist in DOM).
  // We'll pass null and let it fade in as the last card's HTML after state updates.
  return {
    type: 'row-slide',
    cardRects,
    cardHtmls,
    removedIndex,
    newCardHtml: null, // will be set after state update if needed
    deckRect,
    deckHtml,
  }
}

// ─── Dialog state types ───────────────────────────────────────────────────────

type DialogState =
  | { type: 'none' }
  | { type: 'play-card-select' }
  | { type: 'conversion'; card: MerchantCard }
  | { type: 'exchange'; card: MerchantCard }
  | { type: 'discard'; pendingAction: GameAction }

const DemoContent: React.FC<{ aiAnimCallbackRef: React.MutableRefObject<((action: GameAction, state: any) => void) | null> }> = ({ aiAnimCallbackRef }) => {
  const { state, dispatch, currentPlayer, isHumanTurn } = useGame()
  const [opponentPanelWidth, setOpponentPanelWidth] = useState(300)
  const [playedCardsPlayerId, setPlayedCardsPlayerId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<MerchantCard | null>(null)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [selectedMerchantIndex, setSelectedMerchantIndex] = useState<number | null>(null)
  const [paymentMode, setPaymentMode] = useState(false)
  const [pickedCube, setPickedCube] = useState<{ type: SpiceType; index: number } | null>(null)
  const [placedCubes, setPlacedCubes] = useState<Map<number, { type: SpiceType }>>(new Map())
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [merchantRowHidden, setMerchantRowHidden] = useState(false)
  const [pointRowHidden, setPointRowHidden] = useState(false)
  const [dealingPhase, setDealingPhase] = useState<'fade-in' | 'dealing' | 'done' | null>(null)
  const [showRulesModal, setShowRulesModal] = useState(false)

  // Animation system
  const { active: activeAnimations, play: playAnimation } = useAnimations()
  const merchantHideCountRef = React.useRef(0)
  const pointHideCountRef = React.useRef(0)

  /** Play a row-slide animation with the real row hidden during the animation */
  const playRowSlide = useCallback((
    slideAnim: RowSlideAnimation,
    rowType: 'merchant' | 'point'
  ) => {
    const setHidden = rowType === 'merchant' ? setMerchantRowHidden : setPointRowHidden
    const countRef = rowType === 'merchant' ? merchantHideCountRef : pointHideCountRef
    const myCount = ++countRef.current
    const selector = rowType === 'merchant' ? '.merchant-card-row' : '.point-card-row'
    const cardSelector = rowType === 'merchant' ? '.merchant-card' : '.point-card'
    const rowEl = document.querySelector(selector) as HTMLElement | null
    if (rowEl) rowEl.style.visibility = 'hidden'
    setHidden(true)

    // Calculate when the slide finishes so we can fade in the new card
    const stagger = slideAnim.staggerDelay ?? 150
    const slideDur = slideAnim.slideDuration ?? 500
    const cardsToSlide = slideAnim.cardRects.length - slideAnim.removedIndex - 1
    const slideEndTime = stagger * cardsToSlide + slideDur

    // After React renders the new state, capture the new last card and fade it in
    setTimeout(() => {
      // Scope query to the actual row (not animation clones in body)
      const rowContainer = document.querySelector(selector)
      if (!rowContainer) return
      const newCards = rowContainer.querySelectorAll(cardSelector.replace('.', ''))
        ? rowContainer.querySelectorAll(rowType === 'merchant' ? '.merchant-card' : '.point-card')
        : []
      if (newCards.length > 0 && slideAnim.cardRects.length > 0) {
        const lastRect = slideAnim.cardRects[slideAnim.cardRects.length - 1]!
        const lastCard = newCards[newCards.length - 1]
        if (lastCard) {
          const html = lastCard.outerHTML
          setTimeout(() => {
            playAnimation({
              type: 'row-slide',
              cardRects: [],
              cardHtmls: [],
              removedIndex: -1,
              newCardHtml: html,
              deckRect: { left: lastRect.left, top: lastRect.top, width: lastRect.width, height: lastRect.height },
              deckHtml: undefined,
              staggerDelay: 0,
              slideDuration: 0,
            })
          }, slideEndTime - 50)
        }
      }
    }, 50)

    playAnimation(slideAnim).then(() => {
      if (countRef.current === myCount) {
        setHidden(false)
        if (rowEl) rowEl.style.visibility = ''
      }
    })
  }, [playAnimation])

  // Register AI animation callback so GameProvider can trigger animations during AI turns
  useEffect(() => {
    aiAnimCallbackRef.current = (action: GameAction, gameState: any) => {
      if (action.type === 'ACQUIRE_CARD') {
        const payload = action.payload as { cardIndex: number }
        const card = gameState.merchantCardRow?.[payload.cardIndex]
        if (card) {
          const cardEls = document.querySelectorAll('.merchant-card')
          const cardEl = cardEls[payload.cardIndex]
          const opponentPanel = document.querySelector('.opponent-panel')
          if (cardEl && opponentPanel) {
            const from = cardEl.getBoundingClientRect()
            const to = opponentPanel.getBoundingClientRect()
            playAnimation({
              type: 'card-fly',
              imageUrl: card.imageUrl,
              from: { left: from.left, top: from.top, width: from.width, height: from.height },
              to: { left: to.left + 20, top: to.top + 40, width: from.width * 0.4, height: from.height * 0.4 },
            })
          }
          // Row slide for merchant cards
          const slideAnim = captureRowSlide(
            '.merchant-card',
            '.merchant-card-row .deck-card',
            payload.cardIndex
          )
          if (slideAnim) playRowSlide(slideAnim, 'merchant')
        }
      } else if (action.type === 'CLAIM_POINT_CARD') {
        const payload = action.payload as { cardIndex: number }
        const card = gameState.pointCardRow?.[payload.cardIndex]
        if (card) {
          const cardEls = document.querySelectorAll('.point-card')
          const cardEl = cardEls[payload.cardIndex]
          const opponentPanel = document.querySelector('.opponent-panel')
          if (cardEl && opponentPanel) {
            const from = cardEl.getBoundingClientRect()
            const to = opponentPanel.getBoundingClientRect()
            playAnimation({
              type: 'card-fly',
              imageUrl: card.imageUrl,
              from: { left: from.left, top: from.top, width: from.width, height: from.height },
              to: { left: to.left + 20, top: to.top + 40, width: from.width * 0.4, height: from.height * 0.4 },
            })
          }
          // Row slide for point cards
          const pointSlideAnim = captureRowSlide(
            '.point-card',
            '.point-card-row .deck-card',
            payload.cardIndex
          )
          if (pointSlideAnim) playRowSlide(pointSlideAnim, 'point')
        }
      }
    }
    return () => { aiAnimCallbackRef.current = null }
  }, [aiAnimCallbackRef, playAnimation, playRowSlide])

  // Always show the human player's hand/caravan/score, not the current turn's player
  const humanPlayer = state.players.find(p => !p.isAI) || null

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const clearError = () => setActionError(null)

  const closeDialog = useCallback(() => {
    setDialog({ type: 'none' })
  }, [])

  /** Cancel a multi-step action: restore snapshot */
  const handleCancelAction = useCallback(() => {
    dispatch({ type: 'CANCEL_ACTION' })
    closeDialog()
    clearError()
  }, [dispatch, closeDialog])

  // ─── Init / Menu ─────────────────────────────────────────────────────────────

  const handleInitGame = (playerCount = 3, aiCount = 2, aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    setDealingPhase('fade-in')
    dispatch({
      type: 'INIT_GAME',
      payload: { playerCount, aiCount, aiDifficulty },
    })
    // After fade-in (1s) + pause (500ms), start dealing
    setTimeout(() => {
      setDealingPhase('dealing')
      // Point cards take 5 * 200ms + 500ms = 1500ms
      // Merchant cards take 6 * 200ms + 500ms = 1700ms, starting 300ms after point cards
      // Total dealing time: ~3500ms
      setTimeout(() => setDealingPhase('done'), 3500)
    }, 1500)
  }

  const handleLoadGame = () => {
    const saved = loadSavedGame()
    if (saved) {
      dispatch({ type: 'LOAD_GAME', payload: saved })
    }
  }

  const handleShowRules = () => {
    setShowRulesModal(true)
  }

  const handleRestartGame = () => {
    if (confirm('Are you sure you want to restart the game?')) {
      handleInitGame()
    }
  }

  // ─── Action: Play Card ────────────────────────────────────────────────────────

  const handlePlayCard = useCallback(() => {
    const hp = state.players.find(p => !p.isAI)
    if (!hp || !isHumanTurn || !selectedCard) {
      if (!selectedCard) {
        setActionError('Select a card from your hand first')
        playAnimation({ type: 'shake', targetSelector: '.action-buttons' })
      }
      return
    }
    clearError()

    if (isSpiceCard(selectedCard)) {
      // Animate card flying from hand toward the Played Cards button above caravan
      const cardEl = document.querySelector(`.hand-card:nth-child(${(selectedCardIndex ?? 0) + 1})`)
      const btnEl = document.querySelector('.played-cards-btn')
      if (cardEl && btnEl) {
        const from = cardEl.getBoundingClientRect()
        const to = btnEl.getBoundingClientRect()
        playAnimation({
          type: 'card-fly',
          imageUrl: selectedCard.imageUrl,
          from: { left: from.left, top: from.top, width: from.width, height: from.height },
          to: { left: to.left, top: to.top, width: from.width * 0.5, height: from.height * 0.5 },
        })
      }

      // Create snapshot before executing, in case overflow triggers discard dialog that user may cancel
      dispatch({ type: 'BEGIN_ACTION', payload: { actionType: 'PLAY_CARD' } })
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: hp.id,
        payload: { cardId: selectedCard.id },
      }
      dispatch({ type: 'EXECUTE_GAME_ACTION', payload: action })
      
      // Check if caravan overflows after playing
      const totalAfter = getTotalSpices(addSpices(hp.caravan, selectedCard.effect.spices))
      if (totalAfter > 10) {
        setDialog({ type: 'discard', pendingAction: action })
        setSelectedCard(null)
        setSelectedCardIndex(null)
        return
      }
      
      dispatch({ type: 'END_TURN' })
      setSelectedCard(null)
      setSelectedCardIndex(null)
    } else if (isConversionCard(selectedCard)) {
      // Conversion needs snapshot for potential cancellation
      dispatch({ type: 'BEGIN_ACTION', payload: { actionType: 'PLAY_CARD' } })
      setDialog({ type: 'conversion', card: selectedCard })
      setSelectedCard(null)
      setSelectedCardIndex(null)
    } else if (isExchangeCard(selectedCard)) {
      // Exchange needs snapshot for potential cancellation
      dispatch({ type: 'BEGIN_ACTION', payload: { actionType: 'PLAY_CARD' } })
      setDialog({ type: 'exchange', card: selectedCard })
      setSelectedCard(null)
      setSelectedCardIndex(null)
    }
  }, [state.players, isHumanTurn, selectedCard, dispatch, playAnimation])


  const handleConversionConfirm = useCallback(
    (payload: { cardId: string; conversions: Array<{ from: any; to: any }> }) => {
      const hp = state.players.find(p => !p.isAI)
      if (!hp) return
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: hp.id,
        payload,
      }
      dispatch({ type: 'COMMIT_ACTION', payload: action })
      dispatch({ type: 'END_TURN' })
      closeDialog()
      clearError()
    },
    [state.players, dispatch, closeDialog]
  )

  const handleExchangeConfirm = useCallback(
    (payload: { cardId: string; exchangeCount: number }) => {
      const hp = state.players.find(p => !p.isAI)
      if (!hp) return
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: hp.id,
        payload,
      }
      dispatch({ type: 'COMMIT_ACTION', payload: action })
      dispatch({ type: 'END_TURN' })
      closeDialog()
      clearError()
    },
    [state.players, dispatch, closeDialog]
  )

  // ─── Action: Acquire Card ─────────────────────────────────────────────────────

  const handleAcquireCard = useCallback(() => {
    const hp = state.players.find(p => !p.isAI)
    if (!hp || !isHumanTurn) return
    clearError()

    if (selectedMerchantIndex === null) {
      setActionError('Select a merchant card first')
      playAnimation({ type: 'shake', targetSelector: '.action-buttons' })
      return
    }

    if (selectedMerchantIndex === 0) {
      // Free card — acquire immediately
      const card = state.merchantCardRow[0]
      const action: GameAction = {
        type: 'ACQUIRE_CARD',
        playerId: hp.id,
        payload: { cardIndex: 0, spicesToPay: { yellow: 0, red: 0, green: 0, brown: 0 } },
      }
      const validation = GameEngine.validateAction(state, action)
      if (!validation.valid) {
        setActionError(validation.error || 'Invalid action')
        return
      }

      // Animate card flying to hand + row slide
      if (card) {
        const cardEl = document.querySelector('.merchant-card:first-child')
        const handEl = document.querySelector('.player-hand')
        if (cardEl && handEl) {
          const from = cardEl.getBoundingClientRect()
          const to = handEl.getBoundingClientRect()
          playAnimation({
            type: 'card-fly',
            imageUrl: card.imageUrl,
            from: { left: from.left, top: from.top, width: from.width, height: from.height },
            to: { left: to.left + to.width / 2, top: to.top, width: from.width * 0.5, height: from.height * 0.5 },
          })
        }
        // Row slide: remaining merchant cards slide left, new card fades in
        const slideAnim = captureRowSlide(
          '.merchant-card',
          '.merchant-card-row .deck-card',
          0
        )
        if (slideAnim) playRowSlide(slideAnim, 'merchant')
      }

      // Create snapshot before executing, in case overflow triggers discard dialog that user may cancel
      dispatch({ type: 'BEGIN_ACTION', payload: { actionType: 'ACQUIRE_CARD' } })
      dispatch({ type: 'EXECUTE_GAME_ACTION', payload: action })
      
      // Check overflow from bonus spices on the card
      const bonusSpices = state.merchantCardSpices?.[0] || { yellow: 0, red: 0, green: 0, brown: 0 }
      const caravanAfter = addSpices(hp.caravan, bonusSpices)
      if (getTotalSpices(caravanAfter) > 10) {
        setDialog({ type: 'discard', pendingAction: action })
        setSelectedMerchantIndex(null)
        return
      }
      
      dispatch({ type: 'END_TURN' })
      setSelectedMerchantIndex(null)
    } else {
      // Enter spice payment mode
      setPaymentMode(true)
      setPickedCube(null)
      setPlacedCubes(new Map())
    }
  }, [state, isHumanTurn, selectedMerchantIndex, dispatch, playAnimation, playRowSlide])

  const handleMerchantCardClick = useCallback(
    (_card: MerchantCard, index: number) => {
      if (!isHumanTurn) return

      if (paymentMode && selectedMerchantIndex !== null) {
        // In payment mode: handle placing or removing a cube
        if (pickedCube && index < selectedMerchantIndex && !placedCubes.has(index)) {
          // Place the picked cube on this card
          setPlacedCubes(prev => {
            const next = new Map(prev)
            next.set(index, { type: pickedCube.type })
            return next
          })
          setPickedCube(null)
        } else if (!pickedCube && placedCubes.has(index)) {
          // Click a card that already has a placed cube → return it to caravan
          setPlacedCubes(prev => {
            const next = new Map(prev)
            next.delete(index)
            return next
          })
        }
        return
      }

      // Normal mode: toggle selection and clear hand selection
      setSelectedMerchantIndex(prev => prev === index ? null : index)
      setSelectedCard(null)
      setSelectedCardIndex(null)
      setSelectedPointIndex(null)
      setPaymentMode(false)
      setPickedCube(null)
      setPlacedCubes(new Map())
      clearError()
    },
    [isHumanTurn, paymentMode, selectedMerchantIndex, pickedCube, placedCubes]
  )

  // Compute set of caravan indices that have been placed on merchant cards
  const usedCubeIndices = useMemo(() => {
    if (!paymentMode || !humanPlayer) return new Set<number>()
    // Build the spice array the same way CaravanGrid does, then find which indices are used
    const caravan = humanPlayer.caravan
    const spices: SpiceType[] = []
    for (let i = 0; i < caravan.yellow; i++) spices.push('yellow')
    for (let i = 0; i < caravan.red; i++) spices.push('red')
    for (let i = 0; i < caravan.green; i++) spices.push('green')
    for (let i = 0; i < caravan.brown; i++) spices.push('brown')

    // For each placed cube, find the first matching spice index not already used
    const used = new Set<number>()
    const placedTypes: SpiceType[] = []
    for (const [, cube] of placedCubes) {
      placedTypes.push(cube.type)
    }
    for (const t of placedTypes) {
      for (let i = 0; i < spices.length; i++) {
        if (spices[i] === t && !used.has(i)) {
          used.add(i)
          break
        }
      }
    }
    return used
  }, [paymentMode, humanPlayer, placedCubes])

  const handleCubeClick = useCallback(
    (type: SpiceType, index: number) => {
      if (!paymentMode) return
      if (usedCubeIndices.has(index)) return // Can't pick a cube that's already placed

      // Toggle: if this cube is already picked, unpick it
      if (pickedCube && pickedCube.index === index) {
        setPickedCube(null)
      } else {
        setPickedCube({ type, index })
      }
    },
    [paymentMode, pickedCube, usedCubeIndices]
  )

  const handlePaymentConfirm = useCallback(() => {
    const hp = state.players.find(p => !p.isAI)
    if (!hp || selectedMerchantIndex === null) return

    // Build SpiceCollection from placedCubes
    const spicesToPay: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
    // Build spicePlacement array from placedCubes Map
    const spicePlacement: Array<{ cardIndex: number; type: SpiceType }> = []
    for (const [cardIdx, cube] of placedCubes) {
      spicesToPay[cube.type]++
      spicePlacement.push({ cardIndex: cardIdx, type: cube.type })
    }

    const action: GameAction = {
      type: 'ACQUIRE_CARD',
      playerId: hp.id,
      payload: { cardIndex: selectedMerchantIndex, spicesToPay, spicePlacement },
    }
    const validation = GameEngine.validateAction(state, action)
    if (!validation.valid) {
      setActionError(validation.error || 'Invalid action')
      return
    }

    // Animate cubes moving from caravan to merchant cards
    const CUBE_COLORS: Record<SpiceType, string> = { yellow: '#DAA520', red: '#C0392B', green: '#27AE60', brown: '#7B4F2E' }
    const caravanEl = document.querySelector('.player-caravan-fixed')
    if (caravanEl) {
      const caravanRect = caravanEl.getBoundingClientRect()
      for (const [cardIdx, cube] of placedCubes) {
        const targetCardEl = document.querySelectorAll('.merchant-card')[cardIdx]
        if (targetCardEl) {
          const targetRect = targetCardEl.getBoundingClientRect()
          playAnimation({
            type: 'cube-move',
            color: CUBE_COLORS[cube.type],
            from: { left: caravanRect.left + caravanRect.width / 2, top: caravanRect.top + caravanRect.height / 2, width: 14, height: 14 },
            to: { left: targetRect.left + targetRect.width / 2, top: targetRect.top + targetRect.height - 10, width: 14, height: 14 },
            duration: 350,
          })
        }
      }
    }

    // Animate acquired card flying to hand + row slide
    const acquiredCard = state.merchantCardRow[selectedMerchantIndex]
    if (acquiredCard) {
      const cardEl = document.querySelectorAll('.merchant-card')[selectedMerchantIndex]
      const handEl = document.querySelector('.player-hand')
      if (cardEl && handEl) {
        const from = cardEl.getBoundingClientRect()
        const to = handEl.getBoundingClientRect()
        playAnimation({
          type: 'card-fly',
          imageUrl: acquiredCard.imageUrl,
          from: { left: from.left, top: from.top, width: from.width, height: from.height },
          to: { left: to.left + to.width / 2, top: to.top, width: from.width * 0.5, height: from.height * 0.5 },
        })
      }
      // Row slide
      const slideAnim = captureRowSlide(
        '.merchant-card',
        '.merchant-card-row .deck-card',
        selectedMerchantIndex
      )
      if (slideAnim) playRowSlide(slideAnim, 'merchant')
    }

    // Create snapshot before executing, in case overflow triggers discard dialog that user may cancel
    dispatch({ type: 'BEGIN_ACTION', payload: { actionType: 'ACQUIRE_CARD' } })
    dispatch({ type: 'EXECUTE_GAME_ACTION', payload: action })
    
    // Check overflow from bonus spices on the acquired card
    const bonusSpices = state.merchantCardSpices?.[selectedMerchantIndex] || { yellow: 0, red: 0, green: 0, brown: 0 }
    const caravanAfterPay = {
      yellow: hp.caravan.yellow - spicesToPay.yellow + bonusSpices.yellow,
      red: hp.caravan.red - spicesToPay.red + bonusSpices.red,
      green: hp.caravan.green - spicesToPay.green + bonusSpices.green,
      brown: hp.caravan.brown - spicesToPay.brown + bonusSpices.brown,
    }
    if (getTotalSpices(caravanAfterPay) > 10) {
      setDialog({ type: 'discard', pendingAction: action })
      setSelectedMerchantIndex(null)
      setPaymentMode(false)
      setPickedCube(null)
      setPlacedCubes(new Map())
      return
    }
    
    dispatch({ type: 'END_TURN' })
    setSelectedMerchantIndex(null)
    setPaymentMode(false)
    setPickedCube(null)
    setPlacedCubes(new Map())
    clearError()
  }, [state, selectedMerchantIndex, placedCubes, dispatch, playAnimation, playRowSlide])

  const handlePaymentCancel = useCallback(() => {
    setPickedCube(null)
    setPlacedCubes(new Map())
    setPaymentMode(false)
    clearError()
  }, [])

  // ─── Action: Claim Point Card ─────────────────────────────────────────────────

  const handleClaimPointCard = useCallback(() => {
    const hp = state.players.find(p => !p.isAI)
    if (!hp || !isHumanTurn) return
    clearError()

    if (selectedPointIndex === null) {
      setActionError('Select a point card first')
      playAnimation({ type: 'shake', targetSelector: '.action-buttons' })
      return
    }

    const action: GameAction = {
      type: 'CLAIM_POINT_CARD',
      playerId: hp.id,
      payload: { cardIndex: selectedPointIndex },
    }
    const validation = GameEngine.validateAction(state, action)
    if (!validation.valid) {
      setActionError(validation.error || 'Cannot claim this card')
      return
    }

    // Animate spice cubes moving from caravan to the point card
    const claimedCard = state.pointCardRow[selectedPointIndex]
    if (claimedCard) {
      const CUBE_COLORS_CLAIM: Record<SpiceType, string> = { yellow: '#DAA520', red: '#C0392B', green: '#27AE60', brown: '#7B4F2E' }
      const caravanElClaim = document.querySelector('.player-caravan-fixed')
      const cardElsClaim = document.querySelectorAll('.point-card')
      const targetCardEl = cardElsClaim[selectedPointIndex]
      if (caravanElClaim && targetCardEl) {
        const caravanRectClaim = caravanElClaim.getBoundingClientRect()
        const targetRectClaim = targetCardEl.getBoundingClientRect()
        const spiceTypes: SpiceType[] = ['yellow', 'red', 'green', 'brown']
        for (const t of spiceTypes) {
          for (let i = 0; i < claimedCard.requiredSpices[t]; i++) {
            playAnimation({
              type: 'cube-move',
              color: CUBE_COLORS_CLAIM[t],
              from: { left: caravanRectClaim.left + caravanRectClaim.width / 2 + i * 8, top: caravanRectClaim.top + caravanRectClaim.height / 2, width: 12, height: 12 },
              to: { left: targetRectClaim.left + targetRectClaim.width / 2, top: targetRectClaim.top + targetRectClaim.height / 2, width: 12, height: 12 },
              duration: 350,
            })
          }
        }
      }

      // Animate point card flying to hand
      const cardEls = document.querySelectorAll('.point-card')
      const cardEl = cardEls[selectedPointIndex]
      const handEl = document.querySelector('.player-hand')
      if (cardEl && handEl) {
        const from = cardEl.getBoundingClientRect()
        const to = handEl.getBoundingClientRect()
        playAnimation({
          type: 'card-fly',
          imageUrl: claimedCard.imageUrl,
          from: { left: from.left, top: from.top, width: from.width, height: from.height },
          to: { left: to.left + to.width / 2, top: to.top, width: from.width * 0.5, height: from.height * 0.5 },
        })
      }
      // Row slide for point cards
      const pointSlideAnim = captureRowSlide(
        '.point-card',
        '.point-card-row .deck-card',
        selectedPointIndex
      )
      if (pointSlideAnim) playRowSlide(pointSlideAnim, 'point')
    }

    dispatch({ type: 'EXECUTE_GAME_ACTION', payload: action })
    dispatch({ type: 'END_TURN' })
    setSelectedPointIndex(null)
  }, [state, isHumanTurn, selectedPointIndex, dispatch, playAnimation, playRowSlide])

  const handlePointCardClick = useCallback(
    (_card: any, index: number) => {
      if (!isHumanTurn) return
      clearError()
      // Toggle selection, clear other selections
      setSelectedPointIndex(prev => prev === index ? null : index)
      setSelectedCard(null)
      setSelectedCardIndex(null)
      setSelectedMerchantIndex(null)
      setPaymentMode(false)
      setPickedCube(null)
      setPlacedCubes(new Map())
    },
    [isHumanTurn]
  )

  // ─── Action: Rest ─────────────────────────────────────────────────────────────

  const handleRest = useCallback(() => {
    const hp = state.players.find(p => !p.isAI)
    if (!hp || !isHumanTurn) return
    clearError()

    if (hp.playedCards.length === 0) {
      setActionError('No played cards to rest')
      return
    }

    dispatch({
      type: 'EXECUTE_GAME_ACTION',
      payload: {
        type: 'REST',
        playerId: hp.id,
        payload: {},
      },
    })
    dispatch({ type: 'END_TURN' })
  }, [state.players, isHumanTurn, dispatch])

  // ─── Discard flow ─────────────────────────────────────────────────────────────

  const handleDiscardConfirm = useCallback(
    (toDiscard: SpiceCollection) => {
      const hp = state.players.find(p => !p.isAI)
      if (!hp) return

      const playerIndex = state.players.findIndex(p => p.id === hp.id)
      if (playerIndex === -1) return

      const updatedPlayers = state.players.map((p, i) => {
        if (i !== playerIndex) return p
        return {
          ...p,
          caravan: {
            yellow: p.caravan.yellow - toDiscard.yellow,
            red: p.caravan.red - toDiscard.red,
            green: p.caravan.green - toDiscard.green,
            brown: p.caravan.brown - toDiscard.brown,
          },
        }
      })

      dispatch({
        type: 'LOAD_GAME',
        payload: {
          ...state,
          players: updatedPlayers,
          stateSnapshot: null,
        },
      })
      dispatch({ type: 'END_TURN' })
      closeDialog()
      clearError()
    },
    [state, dispatch, closeDialog]
  )

  // ─── Computed availability ────────────────────────────────────────────────────

  const availableActions = humanPlayer && isHumanTurn
    ? GameEngine.getAvailableActions(state, humanPlayer.id)
    : []

  const canPlayCard = availableActions.some(a => a.type === 'PLAY_CARD')
  const canAcquireCard = availableActions.some(a => a.type === 'ACQUIRE_CARD')
  const canClaimPoint = availableActions.some(a => a.type === 'CLAIM_POINT_CARD')
  const canRest = availableActions.some(a => a.type === 'REST')

  // ─── Misc handlers ────────────────────────────────────────────────────────────

  const handlePlayedCardsClick = (playerId: string) => {
    setPlayedCardsPlayerId(playerId)
  }

  const handleClosePlayedCards = () => {
    setPlayedCardsPlayerId(null)
  }

  const handleOpponentPanelWidthChange = (width: number) => {
    setOpponentPanelWidth(width)
  }

  // ─── Setup / Ended screens ────────────────────────────────────────────────────

  if (state.gamePhase === 'setup') {
    return (
      <MainMenu
        onStartGame={handleInitGame}
        onLoadGame={handleLoadGame}
      />
    )
  }

  if (state.gamePhase === 'ended') {
    const winner = state.winner !== null ? state.players[state.winner] : null
    return (
      <>
        <HamburgerMenu onShowRules={handleShowRules} onRestartGame={handleRestartGame} />
        <div className="demo-container">
          <h1>Game Over!</h1>
          <h2>Winner: {winner?.name || 'Unknown'}</h2>
          <p>Final Score: {winner?.score || 0} points</p>
          <button onClick={() => handleInitGame()} className="btn-primary">
            Start New Game
          </button>
        </div>
      </>
    )
  }

  const opponents = state.players.filter(p => p.isAI)
  const playedCardsPlayer = playedCardsPlayerId
    ? state.players.find(p => p.id === playedCardsPlayerId)
    : null

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div onClick={(e) => {
      // If clicking directly on the background (not a card/button), clear all selections
      const target = e.target as HTMLElement
      if (target.closest('.hand-card') || target.closest('.merchant-card') || target.closest('.point-card') || target.closest('.action-btn') || target.closest('.panel-toggle') || target.closest('.hamburger-icon') || target.closest('.hand-toggle') || target.closest('.caravan-box') || target.closest('.banner-btn') || target.closest('.acquire-floating-banner')) return
      setSelectedCard(null)
      setSelectedCardIndex(null)
      setSelectedMerchantIndex(null)
      setSelectedPointIndex(null)
      setPaymentMode(false)
      setPickedCube(null)
      setPlacedCubes(new Map())
    }}>
      {/* Hamburger Menu */}
      <HamburgerMenu onShowRules={handleShowRules} onRestartGame={handleRestartGame} />

      {/* Turn Indicator Banner */}
      {!isHumanTurn && currentPlayer && (
        <div className="turn-banner">
          {state.players[state.currentPlayerIndex]?.name}'s Turn
        </div>
      )}

      {/* Opponent Panel */}
      <OpponentPanel
        opponents={opponents}
        currentPlayerId={humanPlayer?.id || ''}
        onPlayedCardsClick={handlePlayedCardsClick}
        onWidthChange={handleOpponentPanelWidthChange}
      />

      {/* Played Cards Overlay */}
      {playedCardsPlayer && (
        <PlayedCardsOverlay
          playerName={playedCardsPlayer.name}
          cards={playedCardsPlayer.playedCards}
          onClose={handleClosePlayedCards}
        />
      )}

      {/* Player Caravan */}
      {humanPlayer && (
        <PlayerCaravan
          caravan={humanPlayer.caravan}
          playerName={humanPlayer.name}
          onCubeClick={paymentMode ? handleCubeClick : undefined}
          pickedCubeIndex={paymentMode ? (pickedCube?.index ?? null) : null}
          usedIndices={paymentMode ? usedCubeIndices : undefined}
          playedCardsCount={humanPlayer.playedCards.length}
          onPlayedCardsClick={() => setPlayedCardsPlayerId(humanPlayer.id)}
        />
      )}

      {/* Player Score Panel */}
      {humanPlayer && (
        <PlayerScorePanel
          score={humanPlayer.score}
          goldCoins={humanPlayer.coins.gold}
          silverCoins={humanPlayer.coins.silver}
          victoryCardsCount={humanPlayer.pointCards.length}
        />
      )}

      {/* Action Buttons — disabled when not human turn; individual buttons disabled by availability */}
      <ActionButtons
        onPlayCard={handlePlayCard}
        onAcquireCard={handleAcquireCard}
        onClaimPoint={handleClaimPointCard}
        onRest={handleRest}
        disabled={!isHumanTurn}
        playCardDisabled={!canPlayCard}
        acquireCardDisabled={!canAcquireCard}
        claimPointDisabled={!canClaimPoint}
        restDisabled={!canRest}
        errorMessage={actionError}
        onErrorDismiss={clearError}
      />

      {/* Player Hand */}
      {humanPlayer && (
        <PlayerHand
          cards={humanPlayer.hand}
          onCardClick={(card, index) => {
            if (isHumanTurn) {
              // Clear merchant and point selection when selecting a hand card
              setSelectedMerchantIndex(null)
              setSelectedPointIndex(null)
              setPaymentMode(false)
              setPickedCube(null)
              setPlacedCubes(new Map())
              
              if (selectedCardIndex === index) {
                setSelectedCard(null)
                setSelectedCardIndex(null)
              } else {
                setSelectedCard(card)
                setSelectedCardIndex(index)
              }
            }
          }}
          disabled={false}
          selectedCardIndex={selectedCardIndex}
        />
      )}

      {/* Game Board */}
      <GameBoardContainer opponentPanelWidth={opponentPanelWidth}>
        <div className="game-board-content">
          <div style={{ visibility: pointRowHidden ? 'hidden' : 'visible' }} className={dealingPhase === 'dealing' ? 'row-dealing' : dealingPhase === 'fade-in' ? 'row-pre-deal' : ''}>
            <PointCardRow
              cards={state.pointCardRow}
              goldCoins={state.goldCoins}
              silverCoins={state.silverCoins}
              goldOnFirst={state.coinPositions.gold}
              onCardClick={handlePointCardClick}
              selectedIndex={selectedPointIndex}
            />
          </div>
          <div style={{ visibility: merchantRowHidden ? 'hidden' : 'visible' }} className={dealingPhase === 'dealing' ? 'row-dealing row-dealing-merchant' : dealingPhase === 'fade-in' ? 'row-pre-deal' : ''}>
            <MerchantCardRow
              cards={state.merchantCardRow}
              onCardClick={handleMerchantCardClick}
              selectedIndex={selectedMerchantIndex}
              paymentMode={paymentMode}
              placedCubes={placedCubes}
              cardSpices={state.merchantCardSpices}
            />
          </div>
        </div>
      </GameBoardContainer>

      {/* ── Dialogs ── */}

      {dialog.type === 'conversion' && humanPlayer && (
        <ConversionDialog
          card={dialog.card}
          caravan={humanPlayer.caravan}
          onConfirm={handleConversionConfirm}
          onCancel={handleCancelAction}
        />
      )}

      {dialog.type === 'exchange' && humanPlayer && (
        <ExchangeDialog
          card={dialog.card}
          caravan={humanPlayer.caravan}
          onConfirm={handleExchangeConfirm}
          onCancel={handleCancelAction}
        />
      )}

      {dialog.type === 'discard' && humanPlayer && (
        <DiscardDialog
          caravan={humanPlayer.caravan}
          onConfirm={handleDiscardConfirm}
          onCancel={handleCancelAction}
        />
      )}

      {/* Floating banner for spice payment mode */}
      {paymentMode && selectedMerchantIndex !== null && (() => {
        const caravanEl = document.querySelector('.player-caravan-fixed')
        const caravanRect = caravanEl?.getBoundingClientRect()
        const bannerBottom = caravanRect ? (window.innerHeight - caravanRect.top + 8) : 180
        return (
          <div className="acquire-floating-banner" style={{ bottom: `${bannerBottom}px` }}>
            <span className="banner-text">
              {pickedCube
                ? 'Click a merchant card to place it'
                : 'Pick a cube from your caravan'}
            </span>
            <span className="banner-text" style={{ fontSize: '10px', opacity: 0.7 }}>
              {placedCubes.size}/{selectedMerchantIndex} cubes placed
            </span>
            <div className="banner-buttons">
              <button className="banner-btn cancel" onClick={handlePaymentCancel}>
                Cancel
              </button>
              <button
                className="banner-btn confirm"
                onClick={handlePaymentConfirm}
                disabled={placedCubes.size !== selectedMerchantIndex}
              >
                Confirm
              </button>
            </div>
          </div>
        )
      })()}

      {/* Animation overlay */}
      <AnimationLayer animations={activeAnimations} />

      {/* Rules modal (accessible during game via hamburger menu) */}
      {showRulesModal && (
        <RulesModal onClose={() => setShowRulesModal(false)} />
      )}

      {/* White fade-in overlay for game start */}
      {dealingPhase === 'fade-in' && (
        <div className="game-fade-overlay" />
      )}
    </div>
  )
}

export const Demo: React.FC = () => {
  const aiAnimCallbackRef = React.useRef<((action: GameAction, state: any) => void) | null>(null)

  const handleAIAction = useCallback((action: GameAction, gameState: any) => {
    if (aiAnimCallbackRef.current) {
      aiAnimCallbackRef.current(action, gameState)
    }
  }, [])

  return (
    <GameProvider onAIAction={handleAIAction}>
      <DemoContent aiAnimCallbackRef={aiAnimCallbackRef} />
    </GameProvider>
  )
}
