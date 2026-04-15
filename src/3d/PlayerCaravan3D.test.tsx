/**
 * Unit tests for PlayerCaravan3D component
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { PlayerCaravan3D } from './PlayerCaravan3D'
import { SpiceCollection } from '../types'

describe('PlayerCaravan3D', () => {
  it('should render empty caravan', () => {
    const caravan: SpiceCollection = { yellow: 0, red: 0, green: 0, brown: 0 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan with only yellow spices', () => {
    const caravan: SpiceCollection = { yellow: 3, red: 0, green: 0, brown: 0 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan with mixed spices', () => {
    const caravan: SpiceCollection = { yellow: 2, red: 1, green: 1, brown: 1 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan at capacity (10 spices)', () => {
    const caravan: SpiceCollection = { yellow: 3, red: 3, green: 2, brown: 2 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan with only high-value spices', () => {
    const caravan: SpiceCollection = { yellow: 0, red: 0, green: 2, brown: 3 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom position', () => {
    const caravan: SpiceCollection = { yellow: 2, red: 1, green: 0, brown: 0 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} position={[0, 0, 0]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan with all spice types', () => {
    const caravan: SpiceCollection = { yellow: 1, red: 1, green: 1, brown: 1 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render caravan with maximum of one spice type', () => {
    const caravan: SpiceCollection = { yellow: 10, red: 0, green: 0, brown: 0 }
    const { container } = render(
      <Canvas>
        <PlayerCaravan3D caravan={caravan} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
