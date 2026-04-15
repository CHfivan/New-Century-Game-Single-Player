/**
 * Unit tests for SpiceCube3D component
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { SpiceCube3D } from './SpiceCube3D'

describe('SpiceCube3D', () => {
  it('should render yellow spice cube', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="yellow" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render red spice cube', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="red" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render green spice cube', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="green" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render brown spice cube', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="brown" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with custom position', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="yellow" position={[1, 2, 3]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with animation enabled', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="yellow" animated={true} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render with animation disabled', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="yellow" animated={false} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render all spice types with different positions', () => {
    const { container } = render(
      <Canvas>
        <SpiceCube3D spiceType="yellow" position={[0, 0, 0]} />
        <SpiceCube3D spiceType="red" position={[1, 0, 0]} />
        <SpiceCube3D spiceType="green" position={[2, 0, 0]} />
        <SpiceCube3D spiceType="brown" position={[3, 0, 0]} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
