import { describe, it } from 'vitest'
import * as fc from 'fast-check'

describe('Property-Based Testing Setup', () => {
  it('verifies fast-check is working', () => {
    // Simple property: adding two positive numbers always produces a larger result
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (a, b) => {
          const sum = a + b
          return sum > a && sum > b
        }
      ),
      { numRuns: 100 }
    )
  })

  it('verifies array operations maintain length', () => {
    // Property: reversing an array twice returns the original array
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        (arr) => {
          const reversed = [...arr].reverse()
          const doubleReversed = [...reversed].reverse()
          return JSON.stringify(arr) === JSON.stringify(doubleReversed)
        }
      ),
      { numRuns: 100 }
    )
  })
})
