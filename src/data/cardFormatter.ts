/**
 * Card formatting utilities for displaying card effects as text
 */

import { 
  MerchantCard, 
  isSpiceCard, 
  isConversionCard, 
  isExchangeCard 
} from '../types'

/**
 * Format a merchant card effect as a text representation
 * - Spice cards: "YY" or "RRR" (letters for each spice)
 * - Conversion cards: "↑↑" (arrows for upgrades)
 * - Exchange cards: "YYYY → GG" (input → output)
 */
export function formatCardEffect(card: MerchantCard): string {
  if (isSpiceCard(card)) {
    const spices = card.effect.spices
    const parts: string[] = []
    
    if (spices.yellow > 0) parts.push('Y'.repeat(spices.yellow))
    if (spices.red > 0) parts.push('R'.repeat(spices.red))
    if (spices.green > 0) parts.push('G'.repeat(spices.green))
    if (spices.brown > 0) parts.push('B'.repeat(spices.brown))
    
    return parts.join(' ')
  }
  
  if (isConversionCard(card)) {
    return '↑'.repeat(card.effect.upgrades)
  }
  
  if (isExchangeCard(card)) {
    const input = card.effect.input
    const output = card.effect.output
    
    const inputParts: string[] = []
    const outputParts: string[] = []
    
    if (input.yellow > 0) inputParts.push('Y'.repeat(input.yellow))
    if (input.red > 0) inputParts.push('R'.repeat(input.red))
    if (input.green > 0) inputParts.push('G'.repeat(input.green))
    if (input.brown > 0) inputParts.push('B'.repeat(input.brown))
    
    if (output.yellow > 0) outputParts.push('Y'.repeat(output.yellow))
    if (output.red > 0) outputParts.push('R'.repeat(output.red))
    if (output.green > 0) outputParts.push('G'.repeat(output.green))
    if (output.brown > 0) outputParts.push('B'.repeat(output.brown))
    
    return `${inputParts.join('')} → ${outputParts.join('')}`
  }
  
  return 'Unknown'
}

/**
 * Format a card effect with full spice names
 */
export function formatCardEffectVerbose(card: MerchantCard): string {
  if (isSpiceCard(card)) {
    const spices = card.effect.spices
    const parts: string[] = []
    
    if (spices.yellow > 0) parts.push(`${spices.yellow} Turmeric`)
    if (spices.red > 0) parts.push(`${spices.red} Saffron`)
    if (spices.green > 0) parts.push(`${spices.green} Cardamom`)
    if (spices.brown > 0) parts.push(`${spices.brown} Cinnamon`)
    
    return `Gain: ${parts.join(', ')}`
  }
  
  if (isConversionCard(card)) {
    return `Upgrade ${card.effect.upgrades} spice${card.effect.upgrades > 1 ? 's' : ''}`
  }
  
  if (isExchangeCard(card)) {
    const input = card.effect.input
    const output = card.effect.output
    
    const inputParts: string[] = []
    const outputParts: string[] = []
    
    if (input.yellow > 0) inputParts.push(`${input.yellow} Turmeric`)
    if (input.red > 0) inputParts.push(`${input.red} Saffron`)
    if (input.green > 0) inputParts.push(`${input.green} Cardamom`)
    if (input.brown > 0) inputParts.push(`${input.brown} Cinnamon`)
    
    if (output.yellow > 0) outputParts.push(`${output.yellow} Turmeric`)
    if (output.red > 0) outputParts.push(`${output.red} Saffron`)
    if (output.green > 0) outputParts.push(`${output.green} Cardamom`)
    if (output.brown > 0) outputParts.push(`${output.brown} Cinnamon`)
    
    return `Trade: ${inputParts.join(', ')} for ${outputParts.join(', ')}`
  }
  
  return 'Unknown card type'
}

/**
 * Get a short description of a card
 */
export function getCardDescription(card: MerchantCard): string {
  if (isSpiceCard(card)) {
    return 'Spice Card'
  }
  
  if (isConversionCard(card)) {
    return 'Conversion Card'
  }
  
  if (isExchangeCard(card)) {
    return 'Exchange Card'
  }
  
  return 'Unknown'
}
