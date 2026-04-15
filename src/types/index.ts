/**
 * Central export point for all type definitions
 */

// Game types
export type {
  SpiceType,
  SpiceCollection,
  MerchantCardType,
  SpiceEffect,
  ConversionEffect,
  ExchangeEffect,
  MerchantCard,
  PointCard,
  PlayerStatistics,
  Player,
  GamePhase,
  CoinPositions,
  GameState,
  GameActionType,
  PlaySpiceCardPayload,
  PlayConversionCardPayload,
  PlayExchangeCardPayload,
  AcquireCardPayload,
  ClaimPointCardPayload,
  GameAction,
  ValidationResult,
  GameConfig,
} from './game'

// State management types
export type {
  StateActionType,
  InitGamePayload,
  BeginActionPayload,
  StateAction,
  GameContextValue,
} from './state'

// Configuration
export { DEFAULT_CONFIG, getStartingSpices, getVictoryThreshold } from './config'

// Type guards
export {
  isSpiceEffect,
  isConversionEffect,
  isExchangeEffect,
  isSpiceCard,
  isConversionCard,
  isExchangeCard,
  isPlaySpiceCardPayload,
  isPlayConversionCardPayload,
  isPlayExchangeCardPayload,
  isAcquireCardPayload,
  isClaimPointCardPayload,
} from './guards'

// Utility functions
export {
  createEmptySpiceCollection,
  getTotalSpices,
  hasEnoughSpices,
  addSpices,
  subtractSpices,
  cloneSpices,
  areSpicesEqual,
  getNextSpiceType,
  getPreviousSpiceType,
  calculateSpiceValue,
  createEmptyStatistics,
  formatSpices,
  getSpiceColor,
  getSpiceName,
} from './utils'
