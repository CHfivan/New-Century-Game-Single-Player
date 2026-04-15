/**
 * Unit tests for Card3D component
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { Card3D } from './Card3D'

describe('Card3D', () => {
  it('should render with default props', () => {
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom position', () => {
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" position={[1, 2, 3]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom rotation', () => {
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" rotation={[0, Math.PI / 2, 0]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom scale', () => {
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" scale={[2, 2, 2]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should accept onClick handler', () => {
    const handleClick = vi.fn()
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" onClick={handleClick} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render in disabled state', () => {
    const { container } = render(
      <Canvas>
        <Card3D imageUrl="/test.png" disabled={true} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with all props combined', () => {
    const handleClick = vi.fn()
    const { container } = render(
      <Canvas>
        <Card3D
          imageUrl="/test.png"
          position={[1, 2, 3]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.5, 1.5, 1.5]}
          onClick={handleClick}
          disabled={false}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
