import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the loading screen initially', () => {
    render(<App />)
    expect(screen.getByText(/Century: Spice Road/)).toBeDefined()
    expect(screen.getByText(/Loading game assets/)).toBeDefined()
  })

  it('shows a progress indicator', () => {
    render(<App />)
    expect(screen.getByText(/0%/)).toBeDefined()
  })
})
