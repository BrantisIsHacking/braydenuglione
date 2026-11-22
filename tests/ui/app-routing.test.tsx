import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import type { Env } from '../../src/routing/capability'

const loader = vi.hoisted(() => ({ fn: vi.fn() }))
vi.mock('../../src/shell/loadArena', () => ({ loadArena: () => loader.fn() }))

import App from '../../src/App'

const desktop: Env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 }
const phone: Env = { ...desktop, coarsePointer: true, shortSide: 412 }
const noGl: Env = { ...desktop, webgl: false }
const FAILURE = "The arena couldn't start on this device — here's the box score."

const Stub: ComponentType<{ stationId: string | null }> = ({ stationId }) => (
  <div data-testid="arena" data-station={stationId ?? ''} />
)

beforeEach(() => {
  window.location.hash = ''
  Element.prototype.scrollIntoView = vi.fn()
  loader.fn.mockImplementation(() => Promise.resolve({ default: Stub }))
})
afterEach(() => vi.restoreAllMocks())

const cards = (c: HTMLElement) => c.querySelectorAll('[data-station]')
const go = (h: string) =>
  act(() => {
    window.location.hash = h
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })

describe('app routing', () => {
  it('desktop root shows Tip-off, click enters arena', async () => {
    render(<App env={desktop} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Brayden Uglione')
    fireEvent.click(screen.getByRole('button', { name: 'Tip-off' }))
    expect(await screen.findByTestId('arena')).toBeTruthy()
  })
  it('desktop station deep link goes straight to arena', async () => {
    window.location.hash = '#tranquility-base'
    render(<App env={desktop} />)
    expect((await screen.findByTestId('arena')).getAttribute('data-station')).toBe('tranquility-base')
  })
  it('desktop box-score has cards and Enter button', () => {
    window.location.hash = '#/box-score'
    const { container } = render(<App env={desktop} />)
    expect(cards(container)).toHaveLength(24)
    expect(screen.getByRole('button', { name: 'Enter the arena' })).toBeTruthy()
  })
  it('no-webgl box-score has no Enter button', () => {
    window.location.hash = '#/box-score'
    render(<App env={noGl} />)
    expect(screen.queryByRole('button', { name: 'Enter the arena' })).toBeNull()
  })
  it('phone root is box score; Enter goes to arena', async () => {
    render(<App env={phone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter the arena' }))
    expect(window.location.hash).toBe('#/arena')
    await go('#/arena')
    expect(await screen.findByTestId('arena')).toBeTruthy()
  })
  it('no-webgl #/arena falls back to box score', () => {
    window.location.hash = '#/arena'
    const { container } = render(<App env={noGl} />)
    expect(cards(container)).toHaveLength(24)
  })
  it('RF1: loader rejection shows notice and box score', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    loader.fn.mockImplementation(() => Promise.reject(new Error('chunk')))
    window.location.hash = '#/arena'
    vi.resetModules()
    const { default: FreshApp } = await import('../../src/App')
    const { container } = render(<FreshApp env={desktop} />)
    expect(await screen.findByText(FAILURE)).toBeTruthy()
    expect(cards(container)).toHaveLength(24)
  })
  it('RF1: component throwing shows notice and box score', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Bad = () => {
      throw new Error('webgl')
    }
    loader.fn.mockImplementation(() => Promise.resolve({ default: Bad }))
    window.location.hash = '#/arena'
    vi.resetModules()
    const { default: FreshApp } = await import('../../src/App')
    const { container } = render(<FreshApp env={desktop} />)
    expect(await screen.findByText(FAILURE)).toBeTruthy()
    expect(cards(container)).toHaveLength(24)
  })
  it('RF5: tip-off persists across views; station change keeps node', async () => {
    render(<App env={desktop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tip-off' }))
    await screen.findByTestId('arena')
    await go('#/box-score')
    expect(document.querySelectorAll('[data-station]')).toHaveLength(24)
    await go('')
    const node = await screen.findByTestId('arena')
    expect(screen.queryByRole('button', { name: 'Tip-off' })).toBeNull()
    await go('#robotics')
    await waitFor(() => expect(screen.getByTestId('arena').getAttribute('data-station')).toBe('robotics'))
    expect(screen.getByTestId('arena')).toBe(node)
  })
})
