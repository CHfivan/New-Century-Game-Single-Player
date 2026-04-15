/**
 * AIPlayer class
 * Implements AI opponent logic with multiple difficulty levels
 */

import { GameState, GameAction, Player, SpiceCollection, PointCard } from '../types'
import { GameEngine } from './GameEngine'

export type AIDifficulty = 'easy' | 'medium' | 'hard'

interface ActionEvaluation {
  action: GameAction
  score: number
  reasoning: string
}

export class AIPlayer {
  private difficulty: AIDifficulty

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty
  }

  /**
   * Select the best action for the AI player
   */
  selectAction(state: GameState, playerId: string): GameAction {
    const availableActions = GameEngine.getAvailableActions(state, playerId)

    if (availableActions.length === 0) {
      throw new Error('No available actions for AI player')
    }

    switch (this.difficulty) {
      case 'easy':
        return this.selectRandomAction(availableActions)
      case 'medium':
        return this.selectStrategicAction(state, playerId, availableActions)
      case 'hard':
        return this.selectAdvancedAction(state, playerId, availableActions)
      default:
        return this.selectStrategicAction(state, playerId, availableActions)
    }
  }

  /**
   * Easy difficulty: Select random valid action
   */
  private selectRandomAction(availableActions: GameAction[]): GameAction {
    const randomIndex = Math.floor(Math.random() * availableActions.length)
    return availableActions[randomIndex]
  }

  /**
   * Medium difficulty: Select action based on strategic scoring
   */
  private selectStrategicAction(
    state: GameState,
    playerId: string,
    availableActions: GameAction[]
  ): GameAction {
    const evaluations = this.evaluateActions(state, playerId, availableActions)
    return this.selectBestAction(evaluations)
  }

  /**
   * Hard difficulty: Advanced strategy with opponent blocking
   */
  private selectAdvancedAction(
    state: GameState,
    playerId: string,
    availableActions: GameAction[]
  ): GameAction {
    const evaluations = this.evaluateActions(state, playerId, availableActions, true)
    return this.selectBestAction(evaluations)
  }

  /**
   * Evaluate all available actions and assign scores
   */
  evaluateActions(
    state: GameState,
    playerId: string,
    availableActions: GameAction[],
    considerOpponents: boolean = false
  ): ActionEvaluation[] {
    return availableActions.map((action) => ({
      action,
      score: this.scoreAction(state, action, playerId, considerOpponents),
      reasoning: this.explainAction(action),
    }))
  }

  /**
   * Score an action based on strategic value
   */
  scoreAction(
    state: GameState,
    action: GameAction,
    playerId: string,
    considerOpponents: boolean = false
  ): number {
    const player = state.players.find((p) => p.id === playerId)
    if (!player) return 0

    let score = 0

    switch (action.type) {
      case 'CLAIM_POINT_CARD':
        score += this.scoreClaimPointCard(state, action, player)
        break
      case 'ACQUIRE_CARD':
        score += this.scoreAcquireCard(state, action, player)
        break
      case 'PLAY_CARD':
        score += this.scorePlayCard(state, action, player)
        break
      case 'REST':
        score += this.scoreRest(state, player)
        break
    }

    // Consider opponent blocking for hard difficulty
    if (considerOpponents) {
      score += this.scoreOpponentBlocking(state, action, player)
    }

    return score
  }

  /**
   * Score claiming a point card
   */
  private scoreClaimPointCard(state: GameState, action: GameAction, player: Player): number {
    if (action.type !== 'CLAIM_POINT_CARD') return 0

    const payload = action.payload as { cardIndex: number }
    const pointCard = state.pointCardRow[payload.cardIndex]
    if (!pointCard) return 0

    let score = pointCard.points * 10 // Base score from points

    // Bonus for coins
    if (payload.cardIndex === 0 && state.goldCoins > 0) {
      score += 30 // Gold coin worth 3 points = 30 score
    } else if (payload.cardIndex === 1 && state.silverCoins > 0) {
      score += 10 // Silver coin worth 1 point = 10 score
    }

    // Penalty for leftover spices (inefficiency)
    const totalSpices = player.caravan.yellow + player.caravan.red + player.caravan.green + player.caravan.brown
    const requiredSpices = pointCard.requiredSpices.yellow + pointCard.requiredSpices.red + pointCard.requiredSpices.green + pointCard.requiredSpices.brown
    const leftoverSpices = totalSpices - requiredSpices
    score -= leftoverSpices * 2

    return score
  }

  /**
   * Score acquiring a merchant card
   */
  private scoreAcquireCard(state: GameState, action: GameAction, player: Player): number {
    if (action.type !== 'ACQUIRE_CARD') return 0

    const payload = action.payload as { cardIndex: number }
    const card = state.merchantCardRow[payload.cardIndex]
    if (!card) return 0

    let score = 0

    // Cost penalty (cards further left cost more spices)
    const cost = payload.cardIndex
    score -= cost * 5

    // Value based on card type
    if (card.type === 'spice' && 'spices' in card.effect) {
      const spiceValue = this.calculateSpiceValue(card.effect.spices)
      score += spiceValue * 8
    } else if (card.type === 'conversion' && 'upgrades' in card.effect) {
      score += card.effect.upgrades * 15 // Conversion cards are valuable
    } else if (card.type === 'exchange' && 'input' in card.effect && 'output' in card.effect) {
      const inputValue = this.calculateSpiceValue(card.effect.input)
      const outputValue = this.calculateSpiceValue(card.effect.output)
      const efficiency = outputValue - inputValue
      score += efficiency * 10
    }

    // Bonus if hand is small (need more cards)
    if (player.hand.length < 4) {
      score += 10
    }

    return score
  }

  /**
   * Score playing a card
   */
  private scorePlayCard(state: GameState, action: GameAction, player: Player): number {
    if (action.type !== 'PLAY_CARD') return 0

    // Extract cardId from payload
    const payload = action.payload as { cardId: string }
    const card = player.hand.find((c) => c.id === payload.cardId)
    if (!card) return 0

    let score = 0

    // Check if playing this card helps us claim a point card
    const progressScore = this.scoreProgressTowardPointCards(state, card, player)
    score += progressScore

    // Avoid caravan overflow
    if (card.type === 'spice' && 'spices' in card.effect) {
      const totalAfter = this.getTotalSpices(player.caravan) + this.getTotalSpices(card.effect.spices)
      if (totalAfter > 10) {
        score -= 50 // Heavy penalty for overflow
      }
    }

    return score
  }

  /**
   * Score resting (returning played cards to hand)
   */
  private scoreRest(_state: GameState, player: Player): number {
    let score = 0

    // Base value for getting cards back
    score += player.playedCards.length * 5

    // Bonus if we have few cards in hand
    if (player.hand.length <= 2) {
      score += 20
    }

    // Penalty if we haven't played many cards yet
    if (player.playedCards.length < 2) {
      score -= 30
    }

    return score
  }

  /**
   * Score opponent blocking (hard difficulty only)
   */
  private scoreOpponentBlocking(state: GameState, action: GameAction, player: Player): number {
    let score = 0

    // Block valuable point cards
    if (action.type === 'CLAIM_POINT_CARD') {
      const payload = action.payload as { cardIndex: number }
      const opponents = state.players.filter((p) => p.id !== player.id)
      const opponentsClose = opponents.some((opp) => this.canClaimSoon(state, opp, payload.cardIndex))
      if (opponentsClose) {
        score += 15 // Bonus for blocking opponents
      }
    }

    // Block valuable merchant cards
    if (action.type === 'ACQUIRE_CARD') {
      const payload = action.payload as { cardIndex: number }
      if (payload.cardIndex < 2) {
        score += 5 // Small bonus for taking good cards before opponents
      }
    }

    return score
  }

  /**
   * Check if opponent can claim a point card soon
   */
  private canClaimSoon(state: GameState, opponent: Player, cardIndex: number): boolean {
    const pointCard = state.pointCardRow[cardIndex]
    if (!pointCard) return false

    const opponentValue = this.calculateSpiceValue(opponent.caravan)
    const requiredValue = this.calculateSpiceValue(pointCard.requiredSpices)

    // Can claim if within 2 value points
    return opponentValue >= requiredValue - 2
  }

  /**
   * Score progress toward claimable point cards
   */
  private scoreProgressTowardPointCards(state: GameState, card: any, player: Player): number {
    let maxProgress = 0

    for (const pointCard of state.pointCardRow) {
      const progress = this.calculateProgressToCard(player.caravan, pointCard, card)
      maxProgress = Math.max(maxProgress, progress)
    }

    return maxProgress
  }

  /**
   * Calculate progress toward a specific point card
   */
  private calculateProgressToCard(caravan: SpiceCollection, pointCard: PointCard, playedCard: any): number {
    // Simulate playing the card
    const simulatedCaravan = { ...caravan }

    if (playedCard.type === 'spice' && 'spices' in playedCard.effect) {
      simulatedCaravan.yellow += playedCard.effect.spices.yellow
      simulatedCaravan.red += playedCard.effect.spices.red
      simulatedCaravan.green += playedCard.effect.spices.green
      simulatedCaravan.brown += playedCard.effect.spices.brown
    }

    // Calculate how close we are to the point card
    const currentValue = this.calculateSpiceValue(caravan)
    const simulatedValue = this.calculateSpiceValue(simulatedCaravan)
    const requiredValue = this.calculateSpiceValue(pointCard.requiredSpices)

    const currentDistance = Math.max(0, requiredValue - currentValue)
    const simulatedDistance = Math.max(0, requiredValue - simulatedValue)

    const progress = currentDistance - simulatedDistance

    return progress * 10
  }

  /**
   * Calculate total value of spices (weighted by rarity)
   */
  private calculateSpiceValue(spices: SpiceCollection): number {
    return spices.yellow * 1 + spices.red * 2 + spices.green * 3 + spices.brown * 4
  }

  /**
   * Get total number of spices
   */
  private getTotalSpices(spices: SpiceCollection): number {
    return spices.yellow + spices.red + spices.green + spices.brown
  }

  /**
   * Select the best action from evaluations
   */
  private selectBestAction(evaluations: ActionEvaluation[]): GameAction {
    if (evaluations.length === 0) {
      throw new Error('No actions to evaluate')
    }

    // Sort by score descending
    evaluations.sort((a, b) => b.score - a.score)

    const bestEvaluation = evaluations[0]
    if (!bestEvaluation) {
      throw new Error('No best action found')
    }

    return bestEvaluation.action
  }

  /**
   * Explain why an action was chosen (for debugging)
   */
  private explainAction(action: GameAction): string {
    switch (action.type) {
      case 'CLAIM_POINT_CARD': {
        const payload = action.payload as { cardIndex: number }
        return `Claim point card at position ${payload.cardIndex}`
      }
      case 'ACQUIRE_CARD': {
        const payload = action.payload as { cardIndex: number }
        return `Acquire merchant card at position ${payload.cardIndex}`
      }
      case 'PLAY_CARD': {
        const payload = action.payload as { cardId: string }
        return `Play card ${payload.cardId}`
      }
      case 'REST':
        return 'Rest to return played cards to hand'
      default:
        return 'Unknown action'
    }
  }
}
