import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  window.location.hash = ''
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Box Score page', () => {
  it('renders 24 station cards and filters by category', () => {
    const { container } = render(<App />)
    expect(container.querySelectorAll('[data-station]')).toHaveLength(24)
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }))
    expect(container.querySelectorAll('[data-station]')).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(container.querySelectorAll('[data-station]')).toHaveLength(24)
  })

  it('lists 7 rafters banners and the contact email', () => {
    render(<App />)
    const rafters = screen.getByRole('list', { name: 'Rafters' })
    expect(within(rafters).getAllByRole('listitem')).toHaveLength(7)
    const mail = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === 'mailto:uglionebrayden@gmail.com')
    expect(mail.length).toBeGreaterThan(0)
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
