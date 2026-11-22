import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import type { Env } from '../src/routing/capability'

const phoneEnv: Env = { webgl: true, reducedMotion: false, coarsePointer: true, shortSide: 412 }

describe('App', () => {
  it('renders the name as the page h1', () => {
    render(<App env={phoneEnv} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Brayden Uglione')
  })
})
