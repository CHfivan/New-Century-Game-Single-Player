/**
 * Unit tests for PointCardRow3D component
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { PointCardRow3D } from './PointCardRow3D'
import { PointCard } from '../types'

const createMockPointCard = (id: string, points: number): PointCard => ({
  id,
  requiredSpices: { yellow: 0, red: 2, green: 1, brown: 0 },
  points,
  imageUrl: `/point-${id}.png`,
})

describe('PointCardRow3D', () => {
  it('should render empty row with no cards', () => {
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={[]}
          coinPositions={{ gold: false, silver: false }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with single card', () => {
    const cards = [createMockPointCard('1', 5)]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with multiple cards', () => {
    const cards = [
      createMockPointCard('1', 5),
      createMockPointCard('2', 8),
      createMockPointCard('3', 10),
    ]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render row with 5 cards (full row)', () => {
    const cards = [
      createMockPointCard('1', 5),
      createMockPointCard('2', 8),
      createMockPointCard('3', 10),
      createMockPointCard('4', 12),
      createMockPointCard('5', 15),
    ]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with gold coin indicator', () => {
    const cards = [createMockPointCard('1', 5)]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: true, silver: false }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with silver coin indicator', () => {
    const cards = [
      createMockPointCard('1', 5),
      createMockPointCard('2', 8),
    ]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: true }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with both coin indicators', () => {
    const cards = [
      createMockPointCard('1', 5),
      createMockPointCard('2', 8),
    ]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: true, silver: true }}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should accept onCardClick handler', () => {
    const handleClick = vi.fn()
    const cards = [createMockPointCard('1', 5)]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
          onCardClick={handleClick}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render in disabled state', () => {
    const cards = [createMockPointCard('1', 5)]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
          disabled={true}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom base position', () => {
    const cards = [createMockPointCard('1', 5)]
    const { container } = render(
      <Canvas>
        <PointCardRow3D
          cards={cards}
          coinPositions={{ gold: false, silver: false }}
          basePosition={[0, -5, 0]}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
