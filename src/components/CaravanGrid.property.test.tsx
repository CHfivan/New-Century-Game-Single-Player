import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { CaravanGrid } from './CaravanGrid'
import { SpiceCollection } from '../types'

describe('CaravanGrid Property Tests', () => {
  // Feature: century-spice-road-game, Property 21: Caravan Grid Displays Correct Spice Order
  it('displays spices in correct order with correct fill pattern', () => {
    // Generator for valid spice collections (total <= 10)
    const spiceCollectionArb = fc.record({
      yellow: fc.integer({ min: 0, max: 10 }),
      red: fc.integer({ min: 0, max: 10 }),
      green: fc.integer({ min: 0, max: 10 }),
      brown: fc.integer({ min: 0, max: 10 })
    }).filter(spices => 
      spices.yellow + spices.red + spices.green + spices.brown <= 10
    )

    fc.assert(
      fc.property(spiceCollectionArb, (caravan: SpiceCollection) => {
        const { container } = render(<CaravanGrid caravan={caravan} />)
        const boxes = container.querySelectorAll('.caravan-box')
        
        // Property 1: Always exactly 10 boxes
        expect(boxes.length).toBe(10)
        
        // Property 2: Spices appear in correct order (Y, R, G, B)
        const expectedOrder: string[] = []
        for (let i = 0; i < caravan.yellow; i++) expectedOrder.push('yellow')
        for (let i = 0; i < caravan.red; i++) expectedOrder.push('red')
        for (let i = 0; i < caravan.green; i++) expectedOrder.push('green')
        for (let i = 0; i < caravan.brown; i++) expectedOrder.push('brown')
        
        const totalSpices = caravan.yellow + caravan.red + caravan.green + caravan.brown
        
        // Check filled boxes match expected order
        for (let i = 0; i < totalSpices; i++) {
          expect(boxes[i].getAttribute('data-spice')).toBe(expectedOrder[i])
          expect(boxes[i].classList.contains('filled')).toBe(true)
        }
        
        // Property 3: Remaining boxes are empty
        for (let i = totalSpices; i < 10; i++) {
          expect(boxes[i].getAttribute('data-spice')).toBe('empty')
          expect(boxes[i].classList.contains('empty')).toBe(true)
        }
        
        // Property 4: Correct number of filled vs empty boxes
        const filledBoxes = container.querySelectorAll('.caravan-box.filled')
        const emptyBoxes = container.querySelectorAll('.caravan-box.empty')
        expect(filledBoxes.length).toBe(totalSpices)
        expect(emptyBoxes.length).toBe(10 - totalSpices)
        
        // Property 5: Boxes fill left-to-right, top-to-bottom
        // (This is implicitly tested by checking the order above)
        // First 5 boxes are in top row, next 5 in bottom row
        
        return true
      }),
      { numRuns: 100 }
    )
  })

  it('handles edge cases correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          // Empty caravan
          { yellow: 0, red: 0, green: 0, brown: 0 },
          // Full caravan
          { yellow: 3, red: 3, green: 2, brown: 2 },
          // Only one spice type
          { yellow: 10, red: 0, green: 0, brown: 0 },
          { yellow: 0, red: 10, green: 0, brown: 0 },
          { yellow: 0, red: 0, green: 10, brown: 0 },
          { yellow: 0, red: 0, green: 0, brown: 10 },
          // Mixed spices
          { yellow: 2, red: 3, green: 4, brown: 1 }
        ),
        (caravan: SpiceCollection) => {
          const { container } = render(<CaravanGrid caravan={caravan} />)
          const boxes = container.querySelectorAll('.caravan-box')
          
          const totalSpices = caravan.yellow + caravan.red + caravan.green + caravan.brown
          
          // Always 10 boxes
          expect(boxes.length).toBe(10)
          
          // Correct number of filled boxes
          const filledBoxes = container.querySelectorAll('.caravan-box.filled')
          expect(filledBoxes.length).toBe(totalSpices)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('maintains correct colors for all spice types', () => {
    const spiceCollectionArb = fc.record({
      yellow: fc.integer({ min: 0, max: 3 }),
      red: fc.integer({ min: 0, max: 3 }),
      green: fc.integer({ min: 0, max: 3 }),
      brown: fc.integer({ min: 0, max: 3 })
    }).filter(spices => 
      spices.yellow + spices.red + spices.green + spices.brown <= 10
    )

    const EXPECTED_COLORS = {
      yellow: 'rgb(255, 215, 0)',  // #FFD700
      red: 'rgb(220, 20, 60)',     // #DC143C
      green: 'rgb(34, 139, 34)',   // #228B22
      brown: 'rgb(139, 69, 19)'    // #8B4513
    }

    fc.assert(
      fc.property(spiceCollectionArb, (caravan: SpiceCollection) => {
        const { container } = render(<CaravanGrid caravan={caravan} />)
        const boxes = container.querySelectorAll('.caravan-box')
        
        let index = 0
        
        // Check yellow spices
        for (let i = 0; i < caravan.yellow; i++) {
          const box = boxes[index++] as HTMLElement
          expect(box.style.backgroundColor).toBe(EXPECTED_COLORS.yellow)
        }
        
        // Check red spices
        for (let i = 0; i < caravan.red; i++) {
          const box = boxes[index++] as HTMLElement
          expect(box.style.backgroundColor).toBe(EXPECTED_COLORS.red)
        }
        
        // Check green spices
        for (let i = 0; i < caravan.green; i++) {
          const box = boxes[index++] as HTMLElement
          expect(box.style.backgroundColor).toBe(EXPECTED_COLORS.green)
        }
        
        // Check brown spices
        for (let i = 0; i < caravan.brown; i++) {
          const box = boxes[index++] as HTMLElement
          expect(box.style.backgroundColor).toBe(EXPECTED_COLORS.brown)
        }
        
        // Check empty boxes have transparent background
        for (let i = index; i < 10; i++) {
          const box = boxes[i] as HTMLElement
          expect(box.style.backgroundColor).toBe('transparent')
        }
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})
