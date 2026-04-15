import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the demo component', () => {
    render(<App />)
    expect(screen.getByText(/Century: Spice Road/)).toBeDefined()
  })

  it('renders the start game button', () => {
    render(<App />)
    expect(screen.getByText(/New Game/)).toBeDefined()
  })
})
