/**
 * Core game engine for Century: Spice Road
 * Handles game initialization, state management, and rule enforcement
 */

import {
  GameState,
  Player,
  MerchantCard,
  PointCard,
  GameAction,
  ValidationResult,
  createEmptyStatistics,
  DEFAULT_CONFIG,
  getStartingSpices,
  addSpices,
  subtractSpices,
  getTotalSpices,
  hasEnoughSpices,
  isSpiceCard,
  isConversionCard,
  isExchangeCard,
  isPlaySpiceCardPayload,
  isPlayConversionCardPayload,
  isPlayExchangeCardPayload,
  isAcquireCardPayload,
  isClaimPointCardPayload,
  getNextSpiceType,
} from '../types'
import {
  createMerchantDeck,
  createPointDeck,
  getMerchantCardById,
} from '../data'

export class GameEngine {
  /**
   * Create a new game with the specified number of players
   * 
   * @param playerCount - Total number of players (2-5)
   * @param aiCount - Number of AI players (0 to playerCount-1)
   * @param aiDifficulty - Difficulty level for AI players
   * @returns Initialized game state
   */
  static createGame(
    playerCount: number,
    aiCount: number = 0,
    aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): GameState {
    // Validate player count
    if (playerCount < 2 || playerCount > 5) {
      throw new Error('Player count must be between 2 and 5')
    }

    if (aiCount < 0 || aiCount >= playerCount) {
      throw new Error('AI count must be between 0 and playerCount-1')
    }

    // Create and shuffle decks
    const merchantDeck = createMerchantDeck()
    const pointDeck = createPointDeck()

    // Deal merchant cards (6 face-up)
    const merchantCardRow: MerchantCard[] = []
    for (let i = 0; i < DEFAULT_CONFIG.merchantRowSize; i++) {
      const card = merchantDeck.shift()
      if (card) {
        merchantCardRow.push(card)
      }
    }

    // Deal point cards (5 face-up)
    const pointCardRow: PointCard[] = []
    for (let i = 0; i < DEFAULT_CONFIG.pointRowSize; i++) {
      const card = pointDeck.shift()
      if (card) {
        pointCardRow.push(card)
      }
    }

    // Get starting cards
    const spiceCard = getMerchantCardById(DEFAULT_CONFIG.startingCards.spiceCard)
    const upgradeCard = getMerchantCardById(DEFAULT_CONFIG.startingCards.upgradeCard)

    if (!spiceCard || !upgradeCard) {
      throw new Error('Starting cards not found in merchant deck')
    }

    // Randomly determine starting player
    const startingPlayerIndex = Math.floor(Math.random() * playerCount)

    // Create players
    const players: Player[] = []
    for (let i = 0; i < playerCount; i++) {
      const isHuman = i < (playerCount - aiCount)
      const playerIndex = (startingPlayerIndex + i) % playerCount

      players.push({
        id: `player_${i}`,
        name: isHuman ? `Player ${i + 1}` : `AI ${i + 1}`,
        isAI: !isHuman,
        aiDifficulty: !isHuman ? aiDifficulty : undefined,
        caravan: getStartingSpices(playerIndex, playerCount),
        hand: [
          { ...spiceCard },
          { ...upgradeCard },
        ],
        playedCards: [],
        pointCards: [],
        coins: {
          gold: 0,
          silver: 0,
        },
        score: 0,
        statistics: createEmptyStatistics(),
      })
    }

    // Initialize game state
    const gameState: GameState = {
      gameId: `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      players,
      currentPlayerIndex: 0,
      merchantCardRow,
      merchantCardSpices: merchantCardRow.map(() => ({ yellow: 0, red: 0, green: 0, brown: 0 })),
      merchantDeck,
      pointCardRow,
      pointDeck,
      goldCoins: DEFAULT_CONFIG.coinSetup.goldCount,
      silverCoins: DEFAULT_CONFIG.coinSetup.silverCount,
      coinPositions: {
        gold: true,   // Gold coins start on first position
        silver: true, // Silver coins start on second position
      },
      gamePhase: 'playing',
      winner: null,
      turnNumber: 1,
      stateSnapshot: null,
    }

    return gameState
  }

  /**
   * Validate a game action
   * 
   * @param state - Current game state
   * @param action - Action to validate
   * @returns Validation result with error message if invalid
   */
  static validateAction(state: GameState, action: GameAction): ValidationResult {
    // Check if it's the player's turn
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.id !== action.playerId) {
      return { valid: false, error: 'Not your turn' }
    }

    // Validate based on action type
    switch (action.type) {
      case 'PLAY_CARD':
        return this.validatePlayCard(state, action, currentPlayer)
      case 'ACQUIRE_CARD':
        return this.validateAcquireCard(state, action, currentPlayer)
      case 'REST':
        return this.validateRest(currentPlayer)
      case 'CLAIM_POINT_CARD':
        return this.validateClaimPointCard(state, action, currentPlayer)
      default:
        return { valid: false, error: 'Unknown action type' }
    }
  }

  /**
   * Validate play card action
   */
  private static validatePlayCard(
    _state: GameState,
    action: GameAction,
    player: Player
  ): ValidationResult {
    if (isPlaySpiceCardPayload(action.payload)) {
      const payload = action.payload
      const card = player.hand.find(c => c.id === payload.cardId)
      if (!card) {
        return { valid: false, error: 'Card not in hand' }
      }
      if (!isSpiceCard(card)) {
        return { valid: false, error: 'Card is not a spice card' }
      }

      // Check caravan capacity
      const totalAfter = getTotalSpices(addSpices(player.caravan, card.effect.spices))
      if (totalAfter > DEFAULT_CONFIG.maxCaravanSize) {
        return { valid: false, error: 'Caravan would exceed capacity' }
      }

      return { valid: true }

    } else if (isPlayConversionCardPayload(action.payload)) {
      const payload = action.payload
      const card = player.hand.find(c => c.id === payload.cardId)
      if (!card) {
        return { valid: false, error: 'Card not in hand' }
      }
      if (!isConversionCard(card)) {
        return { valid: false, error: 'Card is not a conversion card' }
      }

      // Validate conversions
      if (payload.conversions.length > card.effect.upgrades) {
        return { valid: false, error: 'Too many conversions' }
      }

      // Check if player has the spices to convert
      const caravan = { ...player.caravan }
      for (const conversion of payload.conversions) {
        if (caravan[conversion.from] <= 0) {
          return { valid: false, error: `Not enough ${conversion.from} spices` }
        }
        // Validate conversion follows value chain
        const nextType = getNextSpiceType(conversion.from)
        if (!nextType) {
          return { valid: false, error: `Cannot upgrade ${conversion.from}` }
        }
        // Apply the conversion to the working caravan so multi-step upgrades work
        // (e.g., Y→R then R→G: the R produced by step 1 is consumed by step 2)
        caravan[conversion.from]--
        caravan[nextType]++
      }

      return { valid: true }

    } else if (isPlayExchangeCardPayload(action.payload)) {
      const payload = action.payload
      const card = player.hand.find(c => c.id === payload.cardId)
      if (!card) {
        return { valid: false, error: 'Card not in hand' }
      }
      if (!isExchangeCard(card)) {
        return { valid: false, error: 'Card is not an exchange card' }
      }

      // Check if player can perform the exchanges
      let caravan = { ...player.caravan }
      for (let i = 0; i < payload.exchangeCount; i++) {
        if (!hasEnoughSpices(caravan, card.effect.input)) {
          return { valid: false, error: 'Not enough spices for exchange' }
        }
        caravan = subtractSpices(caravan, card.effect.input)
        caravan = addSpices(caravan, card.effect.output)
      }

      // Check caravan capacity
      if (getTotalSpices(caravan) > DEFAULT_CONFIG.maxCaravanSize) {
        return { valid: false, error: 'Caravan would exceed capacity' }
      }

      return { valid: true }
    }

    return { valid: false, error: 'Invalid play card payload' }
  }

  /**
   * Validate acquire card action
   */
  private static validateAcquireCard(
    state: GameState,
    action: GameAction,
    player: Player
  ): ValidationResult {
    if (!isAcquireCardPayload(action.payload)) {
      return { valid: false, error: 'Invalid acquire card payload' }
    }

    const cardIndex = action.payload.cardIndex
    if (cardIndex < 0 || cardIndex >= state.merchantCardRow.length) {
      return { valid: false, error: 'Invalid card index' }
    }

    // Check if player has enough spices to pay (one per card to the left)
    const cost = cardIndex // Cost is equal to position (0-indexed)
    const totalSpices = getTotalSpices(action.payload.spicesToPay)
    if (totalSpices !== cost) {
      return { valid: false, error: `Must pay exactly ${cost} spice(s)` }
    }

    // Check if player has the spices
    if (!hasEnoughSpices(player.caravan, action.payload.spicesToPay)) {
      return { valid: false, error: 'Not enough spices' }
    }

    return { valid: true }
  }

  /**
   * Validate rest action
   */
  private static validateRest(player: Player): ValidationResult {
    if (player.playedCards.length === 0) {
      return { valid: false, error: 'No played cards to rest' }
    }
    return { valid: true }
  }

  /**
   * Validate claim point card action
   */
  private static validateClaimPointCard(
    state: GameState,
    action: GameAction,
    player: Player
  ): ValidationResult {
    if (!isClaimPointCardPayload(action.payload)) {
      return { valid: false, error: 'Invalid claim point card payload' }
    }

    const cardIndex = action.payload.cardIndex
    if (cardIndex < 0 || cardIndex >= state.pointCardRow.length) {
      return { valid: false, error: 'Invalid card index' }
    }

    const card = state.pointCardRow[cardIndex]
    if (!card) {
      return { valid: false, error: 'Card not found' }
    }

    // Check if player has required spices
    if (!hasEnoughSpices(player.caravan, card.requiredSpices)) {
      return { valid: false, error: 'Not enough spices' }
    }

    return { valid: true }
  }

  /**
   * Execute a game action
   * 
   * @param state - Current game state
   * @param action - Action to execute
   * @returns New game state after action
   */
  static executeAction(state: GameState, action: GameAction): GameState {
    // Validate action first
    const validation = this.validateAction(state, action)
    if (!validation.valid) {
      throw new Error(`Invalid action: ${validation.error}`)
    }

    // Get current player
    const player = state.players.find(p => p.id === action.playerId)
    if (!player) {
      throw new Error(`Player ${action.playerId} not found`)
    }

    // Execute based on action type
    switch (action.type) {
      case 'PLAY_CARD':
        return this.executePlayCard(state, action, player)
      case 'ACQUIRE_CARD':
        return this.executeAcquireCard(state, action, player)
      case 'REST':
        return this.executeRest(state, player)
      case 'CLAIM_POINT_CARD':
        return this.executeClaimPointCard(state, action, player)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Execute play card action
   */
  private static executePlayCard(
    state: GameState,
    action: GameAction,
    player: Player
  ): GameState {
    const playerIndex = state.players.findIndex(p => p.id === player.id)
    const newPlayer = { ...state.players[playerIndex]! }

    if (isPlaySpiceCardPayload(action.payload)) {
      // Play spice card
      const cardId = action.payload.cardId
      const cardIndex = newPlayer.hand.findIndex(c => c.id === cardId)
      if (cardIndex === -1) {
        throw new Error('Card not found in hand')
      }

      const card = newPlayer.hand[cardIndex]!
      if (!isSpiceCard(card)) {
        throw new Error('Card is not a spice card')
      }

      // Add spices to caravan
      newPlayer.caravan = addSpices(newPlayer.caravan, card.effect.spices)

      // Move card from hand to played cards
      newPlayer.hand = newPlayer.hand.filter((_, i) => i !== cardIndex)
      newPlayer.playedCards = [...newPlayer.playedCards, card]

    } else if (isPlayConversionCardPayload(action.payload)) {
      // Play conversion card
      const cardId = action.payload.cardId
      const conversions = action.payload.conversions
      const cardIndex = newPlayer.hand.findIndex(c => c.id === cardId)
      if (cardIndex === -1) {
        throw new Error('Card not found in hand')
      }

      const card = newPlayer.hand[cardIndex]!
      if (!isConversionCard(card)) {
        throw new Error('Card is not a conversion card')
      }

      // Apply conversions
      let caravan = { ...newPlayer.caravan }
      for (const conversion of conversions) {
        if (caravan[conversion.from] > 0) {
          caravan[conversion.from]--
          caravan[conversion.to]++
        }
      }
      newPlayer.caravan = caravan

      // Move card from hand to played cards
      newPlayer.hand = newPlayer.hand.filter((_, i) => i !== cardIndex)
      newPlayer.playedCards = [...newPlayer.playedCards, card]

    } else if (isPlayExchangeCardPayload(action.payload)) {
      // Play exchange card
      const cardId = action.payload.cardId
      const exchangeCount = action.payload.exchangeCount
      const cardIndex = newPlayer.hand.findIndex(c => c.id === cardId)
      if (cardIndex === -1) {
        throw new Error('Card not found in hand')
      }

      const card = newPlayer.hand[cardIndex]!
      if (!isExchangeCard(card)) {
        throw new Error('Card is not an exchange card')
      }

      // Perform exchanges
      let caravan = { ...newPlayer.caravan }
      for (let i = 0; i < exchangeCount; i++) {
        caravan = subtractSpices(caravan, card.effect.input)
        caravan = addSpices(caravan, card.effect.output)
      }
      newPlayer.caravan = caravan

      // Move card from hand to played cards
      newPlayer.hand = newPlayer.hand.filter((_, i) => i !== cardIndex)
      newPlayer.playedCards = [...newPlayer.playedCards, card]
    }

    // Build new players array immutably
    const newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

    return {
      ...state,
      players: newPlayers,
    }
  }

  /**
   * Execute acquire card action
   */
  private static executeAcquireCard(
    state: GameState,
    action: GameAction,
    player: Player
  ): GameState {
    if (!isAcquireCardPayload(action.payload)) {
      throw new Error('Invalid acquire card payload')
    }

    const playerIndex = state.players.findIndex(p => p.id === player.id)
    const newPlayer = { ...state.players[playerIndex]! }

    const cardIndex = action.payload.cardIndex
    const card = state.merchantCardRow[cardIndex]
    if (!card) {
      throw new Error('Card not found in merchant row')
    }

    // Remove spices from caravan (cost)
    newPlayer.caravan = subtractSpices(newPlayer.caravan, action.payload.spicesToPay)

    // Place paid spices onto cards to the left using spicePlacement
    const newMerchantCardSpices = state.merchantCardSpices.map(s => ({ ...s }))
    if (action.payload.spicePlacement) {
      for (const placement of action.payload.spicePlacement) {
        if (placement.cardIndex >= 0 && placement.cardIndex < cardIndex) {
          newMerchantCardSpices[placement.cardIndex]![placement.type]++
        }
      }
    } else {
      // Fallback: distribute spices left-to-right from spicesToPay
      const spiceTypes: Array<'yellow' | 'red' | 'green' | 'brown'> = ['yellow', 'red', 'green', 'brown']
      let targetIdx = 0
      for (const spiceType of spiceTypes) {
        let count = action.payload.spicesToPay[spiceType]
        while (count > 0 && targetIdx < cardIndex) {
          newMerchantCardSpices[targetIdx]![spiceType]++
          targetIdx++
          count--
        }
      }
    }

    // Collect persistent spices sitting on the acquired card (bonus!)
    const bonusSpices = newMerchantCardSpices[cardIndex] || { yellow: 0, red: 0, green: 0, brown: 0 }
    newPlayer.caravan = addSpices(newPlayer.caravan, bonusSpices)

    // Add card to hand
    newPlayer.hand = [...newPlayer.hand, card]

    // Slide cards left and draw new card (immutable)
    const newMerchantRow = state.merchantCardRow.filter((_, i) => i !== cardIndex)
    const newDeck = [...state.merchantDeck]
    const newCard = newDeck.shift()
    if (newCard) {
      newMerchantRow.push(newCard)
    }

    // Shift merchantCardSpices: remove acquired card's entry, add empty for new card
    const shiftedSpices = newMerchantCardSpices.filter((_, i) => i !== cardIndex)
    if (newCard) {
      shiftedSpices.push({ yellow: 0, red: 0, green: 0, brown: 0 })
    }

    // Build new players array immutably
    const newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

    return {
      ...state,
      players: newPlayers,
      merchantCardRow: newMerchantRow,
      merchantCardSpices: shiftedSpices,
      merchantDeck: newDeck,
    }
  }

  /**
   * Execute rest action
   */
  private static executeRest(state: GameState, player: Player): GameState {
    const playerIndex = state.players.findIndex(p => p.id === player.id)
    const newPlayer = { ...state.players[playerIndex]! }

    // Move all played cards back to hand
    newPlayer.hand = [...newPlayer.hand, ...newPlayer.playedCards]
    newPlayer.playedCards = []

    // Build new players array immutably
    const newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

    return {
      ...state,
      players: newPlayers,
    }
  }

  /**
   * Execute claim point card action
   */
  private static executeClaimPointCard(
    state: GameState,
    action: GameAction,
    player: Player
  ): GameState {
    if (!isClaimPointCardPayload(action.payload)) {
      throw new Error('Invalid claim point card payload')
    }

    const playerIndex = state.players.findIndex(p => p.id === player.id)
    const newPlayer = { ...state.players[playerIndex]! }

    const cardIndex = action.payload.cardIndex
    const card = state.pointCardRow[cardIndex]
    if (!card) {
      throw new Error('Card not found in point row')
    }

    // Remove required spices from caravan
    newPlayer.caravan = subtractSpices(newPlayer.caravan, card.requiredSpices)

    // Add point card to player
    newPlayer.pointCards = [...newPlayer.pointCards, card]
    newPlayer.score += card.points

    // Coin tracking (immutable)
    let goldCoins = state.goldCoins
    let silverCoins = state.silverCoins
    let coinPositions = { ...state.coinPositions }
    const newCoins = { ...newPlayer.coins }

    // Award coins based on position
    if (cardIndex === 0 && coinPositions.gold && goldCoins > 0) {
      newCoins.gold++
      goldCoins--
      if (goldCoins === 0) {
        coinPositions.gold = false
      }
    } else if (cardIndex === 1 && coinPositions.silver && silverCoins > 0) {
      newCoins.silver++
      silverCoins--
    } else if (cardIndex === 0 && !coinPositions.gold && silverCoins > 0) {
      newCoins.silver++
      silverCoins--
    }
    newPlayer.coins = newCoins

    // Slide point cards left and draw new card (immutable)
    const newPointRow = state.pointCardRow.filter((_, i) => i !== cardIndex)
    const newDeck = [...state.pointDeck]
    const newCard = newDeck.shift()
    if (newCard) {
      newPointRow.push(newCard)
    }

    const newPlayers = state.players.map((p, i) => i === playerIndex ? newPlayer : p)

    return {
      ...state,
      players: newPlayers,
      pointCardRow: newPointRow,
      pointDeck: newDeck,
      goldCoins,
      silverCoins,
      coinPositions,
    }
  }

  /**
   * Get all available actions for a player
   * 
   * @param state - Current game state
   * @param playerId - Player ID
   * @returns Array of available actions
   */
  static getAvailableActions(state: GameState, playerId: string): GameAction[] {
    const player = state.players.find(p => p.id === playerId)
    if (!player) {
      return []
    }

    // Check if it's the player's turn
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return []
    }

    const actions: GameAction[] = []

    // 1. Play card actions - for each card in hand
    for (const card of player.hand) {
      if (isSpiceCard(card)) {
        // Check if playing this spice card would exceed caravan capacity
        const totalAfter = getTotalSpices(addSpices(player.caravan, card.effect.spices))
        if (totalAfter <= DEFAULT_CONFIG.maxCaravanSize) {
          actions.push({
            type: 'PLAY_CARD',
            playerId,
            payload: {
              cardId: card.id,
            },
          })
        }
      } else if (isConversionCard(card)) {
        // Generate all valid conversion combinations including multi-step upgrades
        // Each upgrade step moves one cube up one level in the chain: Y→R→G→B
        // Multiple steps can be stacked on one cube (e.g., Y→G uses 2 steps)
        const maxUpgrades = card.effect.upgrades
        const CHAIN: Array<'yellow' | 'red' | 'green' | 'brown'> = ['yellow', 'red', 'green', 'brown']
        const chainIdx = (t: string) => CHAIN.indexOf(t as any)

        // Build list of upgradeable cubes
        const upgradeable: Array<'yellow' | 'red' | 'green'> = []
        for (const t of ['yellow', 'red', 'green'] as const) {
          for (let i = 0; i < player.caravan[t]; i++) upgradeable.push(t)
        }

        const seen = new Set<string>()
        const conversionResults: Array<{ from: 'yellow' | 'red' | 'green' | 'brown'; to: 'yellow' | 'red' | 'green' | 'brown' }[]>[] = []

        const recurse = (
          stepsUsed: number,
          startIdx: number,
          assignments: Array<{ cubeType: 'yellow' | 'red' | 'green'; steps: number }>
        ) => {
          if (stepsUsed > 0) {
            // Build conversion list
            const conversions: Array<{ from: 'yellow' | 'red' | 'green' | 'brown'; to: 'yellow' | 'red' | 'green' | 'brown' }> = []
            const tempCaravan = { ...player.caravan }
            let valid = true
            for (const a of assignments) {
              if (tempCaravan[a.cubeType] <= 0) { valid = false; break }
              tempCaravan[a.cubeType]--
              const fi = chainIdx(a.cubeType)
              for (let s = 0; s < a.steps; s++) {
                conversions.push({ from: CHAIN[fi + s]!, to: CHAIN[fi + s + 1]! })
              }
            }
            if (valid) {
              const key = conversions.map(c => `${c.from}-${c.to}`).sort().join('|')
              if (!seen.has(key)) {
                seen.add(key)
                conversionResults.push([conversions])
              }
            }
          }
          if (stepsUsed >= maxUpgrades) return
          for (let i = startIdx; i < upgradeable.length; i++) {
            const cubeType = upgradeable[i]!
            const fi = chainIdx(cubeType)
            const maxSteps = Math.min(maxUpgrades - stepsUsed, 3 - fi)
            for (let steps = 1; steps <= maxSteps; steps++) {
              recurse(stepsUsed + steps, i + 1, [...assignments, { cubeType, steps }])
            }
          }
        }

        recurse(0, 0, [])

        for (const [conversions] of conversionResults) {
          actions.push({
            type: 'PLAY_CARD',
            playerId,
            payload: {
              cardId: card.id,
              conversions,
            },
          })
        }
      } else if (isExchangeCard(card)) {
        // Generate exchange actions for 1, 2, 3... times
        const maxExchanges = Math.floor(getTotalSpices(player.caravan) / getTotalSpices(card.effect.input))
        
        for (let count = 1; count <= maxExchanges; count++) {
          // Check if we have enough spices and won't exceed capacity
          let testCaravan = { ...player.caravan }
          let valid = true
          
          for (let i = 0; i < count; i++) {
            if (!hasEnoughSpices(testCaravan, card.effect.input)) {
              valid = false
              break
            }
            testCaravan = subtractSpices(testCaravan, card.effect.input)
            testCaravan = addSpices(testCaravan, card.effect.output)
          }
          
          if (valid && getTotalSpices(testCaravan) <= DEFAULT_CONFIG.maxCaravanSize) {
            actions.push({
              type: 'PLAY_CARD',
              playerId,
              payload: {
                cardId: card.id,
                exchangeCount: count,
              },
            })
          }
        }
      }
    }

    // 2. Acquire card actions - for each card in merchant row
    for (let i = 0; i < state.merchantCardRow.length; i++) {
      const cost = i
      
      // Try to pay with different spice combinations
      // For simplicity, try paying with one type of spice at a time
      const spiceTypes: Array<'yellow' | 'red' | 'green' | 'brown'> = ['yellow', 'red', 'green', 'brown']
      
      for (const spiceType of spiceTypes) {
        if (player.caravan[spiceType] >= cost) {
          const spicesToPay = { yellow: 0, red: 0, green: 0, brown: 0 }
          spicesToPay[spiceType] = cost
          
          // Build spicePlacement: one spice per card to the left, left-to-right
          const spicePlacement: Array<{ cardIndex: number; type: 'yellow' | 'red' | 'green' | 'brown' }> = []
          for (let j = 0; j < cost; j++) {
            spicePlacement.push({ cardIndex: j, type: spiceType })
          }
          
          actions.push({
            type: 'ACQUIRE_CARD',
            playerId,
            payload: {
              cardIndex: i,
              spicesToPay,
              spicePlacement,
            },
          })
        }
      }
    }

    // 3. Rest action - if player has played cards
    if (player.playedCards.length > 0) {
      actions.push({
        type: 'REST',
        playerId,
        payload: {},
      })
    }

    // 4. Claim point card actions - for each point card in row
    for (let i = 0; i < state.pointCardRow.length; i++) {
      const card = state.pointCardRow[i]
      if (card && hasEnoughSpices(player.caravan, card.requiredSpices)) {
        actions.push({
          type: 'CLAIM_POINT_CARD',
          playerId,
          payload: {
            cardIndex: i,
          },
        })
      }
    }

    return actions
  }

  /**
   * Check if the game is over
   * 
   * @param state - Current game state
   * @returns True if game has ended
   */
  static isGameOver(state: GameState): boolean {
    // Game ends when any player reaches the victory threshold
    // 5 point cards for 2-3 players, 6 point cards for 4-5 players
    const playerCount = state.players.length
    const victoryThreshold = playerCount <= 3 ? 5 : 6

    // Check if any player has reached the threshold
    for (const player of state.players) {
      if (player.pointCards.length >= victoryThreshold) {
        return true
      }
    }

    return false
  }

  /**
   * Calculate final scores for all players
   * 
   * @param state - Current game state
   * @returns Players sorted by final score
   */
  static calculateFinalScores(state: GameState): Player[] {
    // Calculate final scores for each player
    const playersWithScores = state.players.map((player, index) => {
      // Final score = point card values + (gold coins × 3) + (silver coins × 1) + non-yellow spice counts
      const pointCardScore = player.pointCards.reduce((sum, card) => sum + card.points, 0)
      const coinScore = (player.coins.gold * 3) + (player.coins.silver * 1)
      const spiceScore = player.caravan.red + player.caravan.green + player.caravan.brown
      
      const finalScore = pointCardScore + coinScore + spiceScore
      
      return {
        player,
        score: finalScore,
        turnOrder: index, // Store original turn order for tiebreaker (0 = first, higher = later)
      }
    })
    
    // Sort by score (descending), with tiebreaker favoring later turn order (higher index)
    playersWithScores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score // Higher score wins
      }
      // Tiebreaker: later turn order wins (higher index wins)
      return b.turnOrder - a.turnOrder // Higher turnOrder wins
    })
    
    // Return players with updated scores
    return playersWithScores.map(item => ({
      ...item.player,
      score: item.score,
    }))
  }

  /**
   * Serialize game state to JSON
   * 
   * @param state - Game state to serialize
   * @returns JSON string
   */
  static serializeState(state: GameState): string {
    return JSON.stringify(state, null, 2)
  }

  /**
   * Deserialize game state from JSON
   * 
   * @param json - JSON string
   * @returns Game state
   */
  static deserializeState(json: string): GameState {
    const parsed = JSON.parse(json)
    
    // Validate that the parsed object has the required structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid game state: not an object')
    }
    
    if (!Array.isArray(parsed.players)) {
      throw new Error('Invalid game state: players must be an array')
    }
    
    if (!Array.isArray(parsed.merchantCardRow)) {
      throw new Error('Invalid game state: merchantCardRow must be an array')
    }

    // Backward compatibility: initialize merchantCardSpices if missing
    if (!Array.isArray(parsed.merchantCardSpices)) {
      parsed.merchantCardSpices = parsed.merchantCardRow.map(() => ({ yellow: 0, red: 0, green: 0, brown: 0 }))
    }

    // Backward compatibility: initialize gameId if missing
    if (typeof parsed.gameId !== 'string') {
      parsed.gameId = `game_legacy_${Date.now()}`
    }
    
    if (!Array.isArray(parsed.merchantDeck)) {
      throw new Error('Invalid game state: merchantDeck must be an array')
    }
    
    if (!Array.isArray(parsed.pointCardRow)) {
      throw new Error('Invalid game state: pointCardRow must be an array')
    }
    
    if (!Array.isArray(parsed.pointDeck)) {
      throw new Error('Invalid game state: pointDeck must be an array')
    }
    
    if (typeof parsed.currentPlayerIndex !== 'number') {
      throw new Error('Invalid game state: currentPlayerIndex must be a number')
    }
    
    if (typeof parsed.gamePhase !== 'string') {
      throw new Error('Invalid game state: gamePhase must be a string')
    }
    
    return parsed as GameState
  }
}
