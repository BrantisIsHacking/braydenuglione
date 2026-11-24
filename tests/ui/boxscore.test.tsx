import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { BoxScore } from '../../src/boxscore/BoxScore'
import { EXHIBIT_COUNT, exhibits } from '../../src/content'

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  window.location.hash = ''
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Box Score page', () => {
  it('renders 24 station cards grouped into recruiter-ordered sections', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('[data-station]')).toHaveLength(24)
    const h2 = [...container.querySelectorAll('main h2')].map((h) => h.textContent)
    expect(h2).toEqual(['About', 'Experience', 'Projects', 'Leadership', 'Education', 'Awards', 'Off the clock', 'Contact'])
    expect(container.querySelectorAll('#section-projects [data-station]')).toHaveLength(5)
    expect(container.querySelectorAll('#section-experience [data-station]')).toHaveLength(6)
    expect(container.querySelectorAll('#section-education [data-station]')).toHaveLength(8)
  })

  it('lists 7 Hall of Fame banners and the contact email', () => {
    const { container } = render(<App />)
    const hof = container.querySelector('#section-awards') as HTMLElement
    expect(within(hof).getByRole('heading', { name: 'Awards' })).toBeTruthy()
    expect(within(hof).getAllByRole('listitem')).toHaveLength(7)
    const mail = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === 'mailto:uglionebrayden@gmail.com')
    expect(mail.length).toBeGreaterThan(0)
  })

  it('Off the clock carries the Frission player with click-to-load', () => {
    const { container } = render(<App />)
    const card = container.querySelector('[data-exhibit="frission"]') as HTMLElement
    expect(card.closest('section')?.textContent).toContain('Off the clock')
    expect(card.querySelector('iframe')).toBeNull()
    fireEvent.click(within(card).getByRole('button', { name: 'Play Frission' }))
    expect(card.querySelector('iframe')?.getAttribute('src')).toBe('https://open.spotify.com/embed/playlist/0CMrxtb1wc9P83qlrvmJ3o')
  })

  it('renders every exhibit once, with the new sections', () => {
    const { container } = render(<App />)
    const ids = [...container.querySelectorAll('[data-exhibit]')].map((e) => e.getAttribute('data-exhibit'))
    expect(ids).toHaveLength(EXHIBIT_COUNT)
    expect(new Set(ids).size).toBe(EXHIBIT_COUNT)
    expect(new Set(ids)).toEqual(new Set(exhibits.map((e) => e.id)))
    for (const id of ids) expect(container.querySelector(`#${id}`)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Awards' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Off the clock' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeTruthy()
    for (const gone of ['Locker Room', 'Rafters', 'Press Table']) expect(screen.queryByText(gone)).toBeNull()
    expect(screen.getByText('Books on the shelf (75)')).toBeTruthy()
  })

  it('#books scrolls the interest into view', () => {
    window.location.hash = '#books'
    render(<App />)
    const spy = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>
    expect(spy).toHaveBeenCalled()
    expect((spy.mock.contexts as Element[]).some((el) => el.id === 'books')).toBe(true)
  })

  it('Explore button calls onExplore', () => {
    const onExplore = vi.fn()
    render(<BoxScore onExplore={onExplore} />)
    fireEvent.click(screen.getByRole('button', { name: "Explore Brayden's World" }))
    expect(onExplore).toHaveBeenCalled()
  })

  it('unknown deep link renders from the top without errors', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.location.hash = '#tranqility-base'
    const { container } = render(<App />)
    expect(container.querySelectorAll('[data-station]')).toHaveLength(24)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    expect(err).not.toHaveBeenCalled()
  })

  it('valid deep link scrolls to and focuses the card heading', () => {
    window.location.hash = '#robotics'
    const { container } = render(<App />)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    const h = container.querySelector('#robotics .station__title')
    expect(document.activeElement).toBe(h)
  })
})

describe('hashchange', () => {
  it('scrolls to top when hash changes to an unknown id', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)
    expect(spy).not.toHaveBeenCalled()
    act(() => {
      window.location.hash = '#nope'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(spy).toHaveBeenCalledWith(0, 0)
  })

  it('does not scroll to top when hash targets an existing in-page element', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)
    const el = document.createElement('div')
    el.id = 'section-locker'
    document.body.appendChild(el)
    act(() => {
      window.location.hash = '#section-locker'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(spy).not.toHaveBeenCalled()
    el.remove()
  })

  it('does not throw on initial load with a malformed hash', () => {
    window.location.hash = '#100%'
    const { container } = render(<App />)
    expect(container.querySelectorAll('[data-station]')).toHaveLength(24)
  })

  it('resets scroll without throwing on hashchange to a malformed hash', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)
    act(() => {
      window.location.hash = '#100%'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(spy).toHaveBeenCalledWith(0, 0)
  })
})
