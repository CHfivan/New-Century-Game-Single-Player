import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CaravanGrid } from './CaravanGrid'
import { SpiceCollection } from '../types'

describe('CaravanGrid', () => {
  it('renders 10 boxes (2 rows × 5 columns)', () => {
    const caravan: SpiceCollection = {
      yellow: 0,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    expect(boxes.length).toBe(10)
  })

  it('displays spices in correct order (Y, R, G, B)', () => {
    const caravan: SpiceCollection = {
      yellow: 2,
      red: 1,
      green: 1,
      brown: 1
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    // First 2 should be yellow
    expect(boxes[0].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[1].getAttribute('data-spice')).toBe('yellow')
    
    // Next 1 should be red
    expect(boxes[2].getAttribute('data-spice')).toBe('red')
    
    // Next 1 should be green
    expect(boxes[3].getAttribute('data-spice')).toBe('green')
    
    // Next 1 should be brown
    expect(boxes[4].getAttribute('data-spice')).toBe('brown')
    
    // Remaining should be empty
    expect(boxes[5].getAttribute('data-spice')).toBe('empty')
    expect(boxes[6].getAttribute('data-spice')).toBe('empty')
    expect(boxes[7].getAttribute('data-spice')).toBe('empty')
    expect(boxes[8].getAttribute('data-spice')).toBe('empty')
    expect(boxes[9].getAttribute('data-spice')).toBe('empty')
  })

  it('fills boxes left-to-right, top-to-bottom', () => {
    const caravan: SpiceCollection = {
      yellow: 7,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    // First 5 boxes (top row) should be yellow
    for (let i = 0; i < 5; i++) {
      expect(boxes[i].getAttribute('data-spice')).toBe('yellow')
    }
    
    // Next 2 boxes (start of bottom row) should be yellow
    expect(boxes[5].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[6].getAttribute('data-spice')).toBe('yellow')
    
    // Remaining should be empty
    expect(boxes[7].getAttribute('data-spice')).toBe('empty')
    expect(boxes[8].getAttribute('data-spice')).toBe('empty')
    expect(boxes[9].getAttribute('data-spice')).toBe('empty')
  })

  it('displays correct number of filled vs empty boxes', () => {
    const caravan: SpiceCollection = {
      yellow: 2,
      red: 2,
      green: 1,
      brown: 1
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const filledBoxes = container.querySelectorAll('.caravan-box.filled')
    const emptyBoxes = container.querySelectorAll('.caravan-box.empty')
    
    expect(filledBoxes.length).toBe(6) // 2+2+1+1
    expect(emptyBoxes.length).toBe(4)  // 10-6
  })

  it('displays correct colors for each spice type', () => {
    const caravan: SpiceCollection = {
      yellow: 1,
      red: 1,
      green: 1,
      brown: 1
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    // Check background colors
    const yellowBox = boxes[0] as HTMLElement
    const redBox = boxes[1] as HTMLElement
    const greenBox = boxes[2] as HTMLElement
    const brownBox = boxes[3] as HTMLElement
    
    expect(yellowBox.style.backgroundColor).toBe('rgb(255, 215, 0)') // #FFD700
    expect(redBox.style.backgroundColor).toBe('rgb(220, 20, 60)')    // #DC143C
    expect(greenBox.style.backgroundColor).toBe('rgb(34, 139, 34)')  // #228B22
    expect(brownBox.style.backgroundColor).toBe('rgb(139, 69, 19)')  // #8B4513
  })

  it('displays empty boxes with transparent background', () => {
    const caravan: SpiceCollection = {
      yellow: 1,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    // Check that empty boxes have transparent background
    for (let i = 1; i < 10; i++) {
      const box = boxes[i] as HTMLElement
      expect(box.style.backgroundColor).toBe('transparent')
      expect(box.classList.contains('empty')).toBe(true)
    }
  })

  it('updates when caravan prop changes', () => {
    const initialCaravan: SpiceCollection = {
      yellow: 2,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container, rerender } = render(<CaravanGrid caravan={initialCaravan} />)
    
    let boxes = container.querySelectorAll('.caravan-box')
    expect(boxes[0].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[1].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[2].getAttribute('data-spice')).toBe('empty')
    
    // Update caravan
    const updatedCaravan: SpiceCollection = {
      yellow: 2,
      red: 2,
      green: 0,
      brown: 0
    }
    
    rerender(<CaravanGrid caravan={updatedCaravan} />)
    
    boxes = container.querySelectorAll('.caravan-box')
    expect(boxes[0].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[1].getAttribute('data-spice')).toBe('yellow')
    expect(boxes[2].getAttribute('data-spice')).toBe('red')
    expect(boxes[3].getAttribute('data-spice')).toBe('red')
    expect(boxes[4].getAttribute('data-spice')).toBe('empty')
  })

  it('handles full caravan (10 spices)', () => {
    const caravan: SpiceCollection = {
      yellow: 3,
      red: 3,
      green: 2,
      brown: 2
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const filledBoxes = container.querySelectorAll('.caravan-box.filled')
    const emptyBoxes = container.querySelectorAll('.caravan-box.empty')
    
    expect(filledBoxes.length).toBe(10)
    expect(emptyBoxes.length).toBe(0)
  })

  it('handles empty caravan (0 spices)', () => {
    const caravan: SpiceCollection = {
      yellow: 0,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} />)
    const filledBoxes = container.querySelectorAll('.caravan-box.filled')
    const emptyBoxes = container.querySelectorAll('.caravan-box.empty')
    
    expect(filledBoxes.length).toBe(0)
    expect(emptyBoxes.length).toBe(10)
  })

  it('respects custom maxCapacity prop', () => {
    const caravan: SpiceCollection = {
      yellow: 2,
      red: 0,
      green: 0,
      brown: 0
    }
    
    const { container } = render(<CaravanGrid caravan={caravan} maxCapacity={5} />)
    const boxes = container.querySelectorAll('.caravan-box')
    
    expect(boxes.length).toBe(5)
  })
})
