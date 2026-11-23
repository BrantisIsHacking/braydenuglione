import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import type { Env } from '../../src/routing/capability'

const loader = vi.hoisted(() => ({ fn: vi.fn() }))
vi.mock('../../src/shell/loadWorld', () => ({ loadWorld: () => loader.fn() }))

import App, { STARTED_KEY } from '../../src/App'

const desktop: Env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 }
const phone: Env = { ...desktop, coarsePointer: true, shortSide: 412 }
const noGl: Env = { ...desktop, webgl: false }
const FAILURE = "Brayden's World couldn't start on this device — here's the box score."

const Stub: ComponentType<{ env: Env }> = () => <div data-testid="world" />

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.sessionStorage.clear()
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  loader.fn.mockImplementation(() => Promise.resolve({ default: Stub }))
})
afterEach(() => vi.restoreAllMocks())

const cards = (c: HTMLElement) => c.querySelectorAll('[data-exhibit]')
const go = (h: string) =>
  act(() => {
    window.location.hash = h
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
const fresh = async () => {
  vi.resetModules()
  return (await import('../../src/App')).default
}

describe('app routing', () => {
  it("desktop '' → StartScreen; Explore → world, started is remembered", async () => {
    render(<App env={desktop} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("Brayden's World")
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }))
    expect(await screen.findByTestId('world')).toBeTruthy()
    expect(window.sessionStorage.getItem(STARTED_KEY)).toBe('1')
  })
  it('#/world with started → world, no StartScreen', async () => {
    window.sessionStorage.setItem(STARTED_KEY, '1')
    window.history.replaceState(null, '', '/#/world')
    render(<App env={desktop} />)
    expect(await screen.findByTestId('world')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Explore' })).toBeNull()
  })
  it('#/world without started → StartScreen', () => {
    window.history.replaceState(null, '', '/#/world')
    render(<App env={desktop} />)
    expect(screen.getByRole('button', { name: 'Explore' })).toBeTruthy()
  })
  it('#tranquility-base on desktop → world (no StartScreen) and marks started', async () => {
    window.history.replaceState(null, '', '/#tranquility-base')
    render(<App env={desktop} />)
    expect(await screen.findByTestId('world')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Explore' })).toBeNull()
    expect(window.sessionStorage.getItem(STARTED_KEY)).toBe('1')
  })
  it("phone '' → Box Score with 45 cards; Explore goes to #/world", async () => {
    const { container } = render(<App env={phone} />)
    expect(cards(container)).toHaveLength(45)
    fireEvent.click(screen.getByRole('button', { name: "Explore Brayden's World" }))
    expect(window.location.hash).toBe('#/world')
    await go('#/world')
    expect(await screen.findByTestId('world')).toBeTruthy()
  })
  it('phone #books → Box Score', () => {
    window.history.replaceState(null, '', '/#books')
    const { container } = render(<App env={phone} />)
    expect(cards(container)).toHaveLength(45)
  })
  it('no-webgl box score has no Explore button', () => {
    window.history.replaceState(null, '', '/#/box-score')
    render(<App env={noGl} />)
    expect(screen.queryByRole('button', { name: "Explore Brayden's World" })).toBeNull()
  })
  it('#/arena → replaced by #/b/gym before first render, history.length unchanged', async () => {
    window.history.pushState(null, '', '/#/arena')
    const len = window.history.length
    render(<App env={desktop} />)
    expect(window.location.hash).toBe('#/b/gym')
    expect(window.history.length).toBe(len)
    expect(await screen.findByTestId('world')).toBeTruthy()
  })
  it('#/b/scouting-office → Box Score', () => {
    window.history.replaceState(null, '', '/#/b/scouting-office')
    const { container } = render(<App env={desktop} />)
    expect(cards(container)).toHaveLength(45)
    expect(screen.queryByTestId('world')).toBeNull()
  })
  it('RF1: loader rejection → Box Score with the failure notice', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    loader.fn.mockImplementation(() => Promise.reject(new Error('chunk')))
    window.history.replaceState(null, '', '/#/b/gym')
    const FreshApp = await fresh()
    const { container } = render(<FreshApp env={desktop} />)
    expect(await screen.findByText(FAILURE)).toBeTruthy()
    expect(cards(container)).toHaveLength(45)
  })
  it('RF1: world component throwing → Box Score with the failure notice', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Bad = () => {
      throw new Error('webgl')
    }
    loader.fn.mockImplementation(() => Promise.resolve({ default: Bad }))
    window.history.replaceState(null, '', '/#/b/gym')
    const FreshApp = await fresh()
    render(<FreshApp env={desktop} />)
    expect(await screen.findByText(FAILURE)).toBeTruthy()
  })
  it('the world node stays mounted across in-world hash changes; box score and back skip the start screen', async () => {
    render(<App env={desktop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }))
    const node = await screen.findByTestId('world')
    await go('#robotics')
    expect(screen.getByTestId('world')).toBe(node)
    await go('#/b/gym')
    expect(screen.getByTestId('world')).toBe(node)
    await go('#/box-score')
    expect(screen.queryByTestId('world')).toBeNull()
    await go('#/world')
    expect(await screen.findByTestId('world')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Explore' })).toBeNull()
  })
})
