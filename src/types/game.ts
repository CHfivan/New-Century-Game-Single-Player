/**
 * Core game type definitions for Century: Spice Road
 * These types define the complete game state and all game entities
 */

/**
 * Spice types in ascending value order
 */
export type SpiceType = 'yellow' | 'red' | 'green' | 'brown'

/**
 * Collection of spices by type
 * yellow = Turmeric, red = Saffron, green = Cardamom, brown = Cinnamon
 */
export interface SpiceCollection {
  yellow: number  // Turmeric (lowest value)
  red: number     // Saffron
  green: number   // Cardamom
  brown: number   // Cinnamon (highest value)
}

/**
 * Merchant card types
 */
export type MerchantCardType = 'spice' | 'conversion' | 'exchange'

/**
 * Effect for spice cards - adds spices to caravan
 */
export interface SpiceEffect {
  spices: SpiceCollection
}

/**
 * Effect for conversion cards - upgrades spices along value chain
 */
export interface ConversionEffect {
  upgrades: number  // Number of upgrade steps allowed
}

/**
 * Effect for exchange cards - trades input spices for output spices
 */
export interface ExchangeEffect {
  input: SpiceCollection
  output: SpiceCollection
}

/**
 * Merchant card that players can play or acquire
 */
export interface MerchantCard {
  id: string
  type: MerchantCardType
  effect: SpiceEffect | ConversionEffect | ExchangeEffect
  imageUrl: string
}

/**
 * Point card that players can claim for victory points
 */
export interface PointCard {
  id: string
  requiredSpices: SpiceCollection
  points: number
  imageUrl: string
}

/**
 * Player statistics tracked during gameplay
 */
export interface PlayerStatistics {
  cubesGained: SpiceCollection
  cubesSpent: SpiceCollection
  merchantCardsPlayed: number
  merchantCardsAcquired: number
  restActionsTaken: number
  cardUsageCount: Map<string, number>  // cardId -> usage count
  pointProgression: Array<{ turn: number; points: number }>
  turnTimings: number[]  // milliseconds per turn
  turnStartTime: number | null
}

/**
 * Player in the game (human or AI)
 */
export interface Player {
  id: string
  name: string
  isAI: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard'
  caravan: SpiceCollection
  hand: MerchantCard[]
  playedCards: MerchantCard[]
  pointCards: PointCard[]
  coins: {
    gold: number
    silver: number
  }
  score: number
  statistics: PlayerStatistics
}

/**
 * Game phase
 */
export type GamePhase = 'setup' | 'playing' | 'ended'

/**
 * Coin position tracking
 */
export interface CoinPositions {
  gold: boolean   // true if gold coins are on first position
  silver: boolean // true if silver coins are on second position
}

/**
 * Complete game state
 */
export interface GameState {
  gameId: string  // Unique identifier for this game instance (used to detect restarts)
  players: Player[]
  currentPlayerIndex: number
  merchantCardRow: MerchantCard[]
  merchantCardSpices: SpiceCollection[]  // Persistent spices sitting on each merchant card (parallel to merchantCardRow)
  merchantDeck: MerchantCard[]
  pointCardRow: PointCard[]
  pointDeck: PointCard[]
  goldCoins: number
  silverCoins: number
  coinPositions: CoinPositions
  gamePhase: GamePhase
  winner: number | null
  turnNumber: number
  stateSnapshot: GameState | null  // For action cancellation
}

/**
 * Game action types
 */
export type GameActionType = 
  | 'PLAY_CARD' 
  | 'ACQUIRE_CARD' 
  | 'REST' 
  | 'CLAIM_POINT_CARD'

/**
 * Payload for playing a spice card
 */
export interface PlaySpiceCardPayload {
  cardId: string
}

/**
 * Payload for playing a conversion card
 */
export interface PlayConversionCardPayload {
  cardId: string
  conversions: Array<{
    from: SpiceType
    to: SpiceType
  }>
}

/**
 * Payload for playing an exchange card
 */
export interface PlayExchangeCardPayload {
  cardId: string
  exchangeCount: number  // How many times to perform the exchange
}

/**
 * Payload for acquiring a merchant card
 */
export interface AcquireCardPayload {
  cardIndex: number  // Index in merchant card row (0-5)
  spicesToPay: SpiceCollection  // Total spices paid (for validation)
  spicePlacement?: Array<{ cardIndex: number; type: SpiceType }>  // Which spice goes on which card to the left
}

/**
 * Payload for claiming a point card
 */
export interface ClaimPointCardPayload {
  cardIndex: number  // Index in point card row (0-4)
}

/**
 * Game action that can be executed
 */
export interface GameAction {
  type: GameActionType
  playerId: string
  payload: 
    | PlaySpiceCardPayload 
    | PlayConversionCardPayload 
    | PlayExchangeCardPayload
    | AcquireCardPayload 
    | ClaimPointCardPayload
    | Record<string, never>  // Empty object for REST action
}

/**
 * Validation result for game actions
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Game configuration
 */
export interface GameConfig {
  maxCaravanSize: number
  startingCards: {
    spiceCard: string  // Card ID
    upgradeCard: string  // Card ID
  }
  startingSpices: {
    player1: SpiceCollection
    player2_3: SpiceCollection
    player4_5: SpiceCollection
  }
  coinSetup: {
    goldCount: number
    silverCount: number
  }
  victoryCardThreshold: {
    players2_3: number
    players4_5: number
  }
  merchantRowSize: number
  pointRowSize: number
}
