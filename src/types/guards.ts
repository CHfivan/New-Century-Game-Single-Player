/**
 * Type guard functions for runtime type checking
 */

import {
  MerchantCard,
  SpiceEffect,
  ConversionEffect,
  ExchangeEffect,
  PlaySpiceCardPayload,
  PlayConversionCardPayload,
  PlayExchangeCardPayload,
  AcquireCardPayload,
  ClaimPointCardPayload,
} from './game'

/**
 * Type guard for SpiceEffect
 */
export function isSpiceEffect(effect: unknown): effect is SpiceEffect {
  return (
    typeof effect === 'object' &&
    effect !== null &&
    'spices' in effect
  )
}

/**
 * Type guard for ConversionEffect
 */
export function isConversionEffect(effect: unknown): effect is ConversionEffect {
  return (
    typeof effect === 'object' &&
    effect !== null &&
    'upgrades' in effect &&
    typeof (effect as ConversionEffect).upgrades === 'number'
  )
}

/**
 * Type guard for ExchangeEffect
 */
export function isExchangeEffect(effect: unknown): effect is ExchangeEffect {
  return (
    typeof effect === 'object' &&
    effect !== null &&
    'input' in effect &&
    'output' in effect
  )
}

/**
 * Type guard for spice card
 */
export function isSpiceCard(card: MerchantCard): card is MerchantCard & { effect: SpiceEffect } {
  return card.type === 'spice' && isSpiceEffect(card.effect)
}

/**
 * Type guard for conversion card
 */
export function isConversionCard(card: MerchantCard): card is MerchantCard & { effect: ConversionEffect } {
  return card.type === 'conversion' && isConversionEffect(card.effect)
}

/**
 * Type guard for exchange card
 */
export function isExchangeCard(card: MerchantCard): card is MerchantCard & { effect: ExchangeEffect } {
  return card.type === 'exchange' && isExchangeEffect(card.effect)
}

/**
 * Type guard for PlaySpiceCardPayload
 */
export function isPlaySpiceCardPayload(payload: unknown): payload is PlaySpiceCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'cardId' in payload &&
    !('conversions' in payload) &&
    !('exchangeCount' in payload)
  )
}

/**
 * Type guard for PlayConversionCardPayload
 */
export function isPlayConversionCardPayload(payload: unknown): payload is PlayConversionCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'cardId' in payload &&
    'conversions' in payload &&
    Array.isArray((payload as PlayConversionCardPayload).conversions)
  )
}

/**
 * Type guard for PlayExchangeCardPayload
 */
export function isPlayExchangeCardPayload(payload: unknown): payload is PlayExchangeCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'cardId' in payload &&
    'exchangeCount' in payload &&
    typeof (payload as PlayExchangeCardPayload).exchangeCount === 'number'
  )
}

/**
 * Type guard for AcquireCardPayload
 */
export function isAcquireCardPayload(payload: unknown): payload is AcquireCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'cardIndex' in payload &&
    'spicesToPay' in payload
  )
}

/**
 * Type guard for ClaimPointCardPayload
 */
export function isClaimPointCardPayload(payload: unknown): payload is ClaimPointCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'cardIndex' in payload &&
    typeof (payload as ClaimPointCardPayload).cardIndex === 'number'
  )
}
