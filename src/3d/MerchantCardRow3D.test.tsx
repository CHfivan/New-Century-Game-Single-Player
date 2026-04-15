/**
 * Unit tests for MerchantCardRow3D component
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { MerchantCardRow3D } from './MerchantCardRow3D'
import { MerchantCard } from '../types'

const createMockCard = (id: string): MerchantCard => ({
  id,
  type: 'spice',
  effect: { spices: { yellow: 1, red: 0, green: 0, brown: 0 } },
  imageUrl: `/card-${id}.png`,
})

describe('MerchantCardRow3D', () => {
  it('should render empty row with no cards', () => {
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={[]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with single card', () => {
    const cards = [createMockCard('1')]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with multiple cards', () => {
    const cards = [
      createMockCard('1'),
      createMockCard('2'),
      createMockCard('3'),
    ]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with 6 cards (full row)', () => {
    const cards = [
      createMockCard('1'),
      createMockCard('2'),
      createMockCard('3'),
      createMockCard('4'),
      createMockCard('5'),
      createMockCard('6'),
    ]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should accept onCardClick handler', () => {
    const handleClick = vi.fn()
    const cards = [createMockCard('1'), createMockCard('2')]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} onCardClick={handleClick} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render in disabled state', () => {
    const cards = [createMockCard('1')]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} disabled={true} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom base position', () => {
    const cards = [createMockCard('1')]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D cards={cards} basePosition={[0, 5, 0]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with all props combined', () => {
    const handleClick = vi.fn()
    const cards = [
      createMockCard('1'),
      createMockCard('2'),
      createMockCard('3'),
    ]
    const { container } = render(
      <Canvas>
        <MerchantCardRow3D
          cards={cards}
          onCardClick={handleClick}
          disabled={false}
          basePosition={[0, 2, 0]}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
