import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loader = vi.hoisted(() => ({ fn: vi.fn() }))
vi.mock('../../src/shell/loadWorld', () => ({ loadWorld: () => loader.fn() }))

import { StartScreen } from '../../src/shell/StartScreen'

beforeEach(() => {
  window.location.hash = ''
  loader.fn.mockReset()
  loader.fn.mockImplementation(() => Promise.reject(new Error('x')))
})

describe('StartScreen', () => {
  it('shows the title, focuses Explore and preloads the world', () => {
    const onExplore = vi.fn()
    render(<StartScreen onExplore={onExplore} />)
    expect(screen.getByRole('heading', { level: 1, name: "Brayden's World" })).toBeTruthy()
    const explore = screen.getByRole('button', { name: 'Explore' })
    expect(document.activeElement).toBe(explore)
    fireEvent.click(explore)
    expect(onExplore).toHaveBeenCalled()
    expect(loader.fn).toHaveBeenCalled()
    expect(screen.getByText(/W A S D/)).toBeTruthy()
  })
  it('Scouting Report goes to the box score; touch hint differs', () => {
    render(<StartScreen onExplore={() => {}} touch />)
    fireEvent.click(screen.getByRole('button', { name: 'Scouting Report' }))
    expect(window.location.hash).toBe('#/box-score')
    expect(screen.getByText(/Drag the pad to move/)).toBeTruthy()
  })
})
