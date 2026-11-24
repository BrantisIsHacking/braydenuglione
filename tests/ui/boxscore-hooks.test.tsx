import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveSection } from '../../src/boxscore/useActiveSection'
import { useSpotlight } from '../../src/boxscore/useSpotlight'

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void
let observers: { cb: Cb; targets: Element[]; opts?: IntersectionObserverInit }[] = []

class FakeIO {
  entry: { cb: Cb; targets: Element[]; opts?: IntersectionObserverInit }
  constructor(cb: Cb, opts?: IntersectionObserverInit) {
    this.entry = { cb, targets: [], opts }
    observers.push(this.entry)
  }
  observe(el: Element) {
    this.entry.targets.push(el)
  }
  unobserve() {}
  disconnect() {
    this.entry.targets = []
  }
}

beforeEach(() => {
  observers = []
  vi.stubGlobal('IntersectionObserver', FakeIO)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function Nav() {
  const active = useActiveSection(['s1', 's2', 's3'], 'end')
  return (
    <>
      <p data-testid="active">{active}</p>
      <section id="s1" />
      <section id="s2" />
      <section id="s3" />
      <div id="end" />
    </>
  )
}

const fire = (obs: (typeof observers)[number], id: string, isIntersecting: boolean) =>
  act(() => obs.cb([{ target: obs.targets.find((t) => t.id === id)!, isIntersecting }]))

describe('useActiveSection', () => {
  it('starts on the first section and follows the sections crossing the band', () => {
    const { getByTestId } = render(<Nav />)
    expect(getByTestId('active').textContent).toBe('s1')
    const band = observers.find((o) => o.targets.some((t) => t.id === 's1'))!
    fire(band, 's2', true)
    expect(getByTestId('active').textContent).toBe('s2')
    fire(band, 's2', false)
    fire(band, 's3', true)
    expect(getByTestId('active').textContent).toBe('s3')
  })
  it('keeps the last section when none cross, and jumps to the last when the page end shows', () => {
    const { getByTestId } = render(<Nav />)
    const band = observers.find((o) => o.targets.some((t) => t.id === 's1'))!
    fire(band, 's2', true)
    fire(band, 's2', false)
    expect(getByTestId('active').textContent).toBe('s2')
    const end = observers.find((o) => o.targets.some((t) => t.id === 'end'))!
    fire(end, 'end', true)
    expect(getByTestId('active').textContent).toBe('s3')
    fire(end, 'end', false)
    expect(getByTestId('active').textContent).toBe('s3')
  })
  it('does nothing (and does not throw) without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { getByTestId } = render(<Nav />)
    expect(getByTestId('active').textContent).toBe('s1')
  })
})

function Spot() {
  const ref = useSpotlight<HTMLDivElement>()
  return <div ref={ref} data-testid="root" />
}

const mq = (matches: Record<string, boolean>) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches[q] ?? false, media: q, addEventListener() {}, removeEventListener() {} }))

describe('useSpotlight', () => {
  const FINE = '(hover: hover) and (pointer: fine)'
  const REDUCED = '(prefers-reduced-motion: reduce)'
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => {
      f(0)
      return 1
    })
  })

  it('tracks the pointer in CSS variables on a fine pointer', () => {
    mq({ [FINE]: true })
    const { getByTestId } = render(<Spot />)
    move(120, 340)
    const el = getByTestId('root')
    expect(el.style.getPropertyValue('--mx')).toBe('120px')
    expect(el.style.getPropertyValue('--my')).toBe('340px')
    expect(el.dataset.spot).toBe('on')
  })
  it('is off under reduced motion', () => {
    mq({ [FINE]: true, [REDUCED]: true })
    const { getByTestId } = render(<Spot />)
    move(5, 5)
    expect(getByTestId('root').style.getPropertyValue('--mx')).toBe('')
    expect(getByTestId('root').dataset.spot).toBeUndefined()
  })
  it('is off on touch (no fine hover pointer)', () => {
    mq({})
    const { getByTestId } = render(<Spot />)
    move(5, 5)
    expect(getByTestId('root').style.getPropertyValue('--mx')).toBe('')
    expect(getByTestId('root').dataset.spot).toBeUndefined()
  })
})

// jsdom has no PointerEvent, so a MouseEvent of type "pointermove" carries the coordinates.
function move(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY }))
  })
}
