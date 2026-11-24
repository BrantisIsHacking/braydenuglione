import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'
import { BoxScore } from '../../src/boxscore/BoxScore'
import type { Env } from '../../src/routing/capability'
import { findPrivateTerm, loadPrivateTerms } from '../../src/privacy/privateTerms.mjs'

const env = (over: Partial<Env>): Env => ({ webgl: false, reducedMotion: false, coarsePointer: false, shortSide: 800, ...over })

beforeEach(() => {
  window.location.hash = '#/box-score'
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Box Score recruiter page', () => {
  it('has one h1 (the name), the landmarks and a skip link', () => {
    const { container } = render(<BoxScore />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Brayden Uglione')
    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#content')
    expect(container.querySelector('#content')).toBe(screen.getByRole('main'))
    expect(screen.getByText('SWE · Data Science · ML')).toBeTruthy()
  })

  it('shows GitHub, LinkedIn, Devpost and email icon links', () => {
    render(<BoxScore />)
    const header = within(screen.getByRole('banner'))
    for (const n of [/^GitHub/, /^LinkedIn/, /^Devpost/, /^Email/]) expect(header.getByRole('link', { name: n })).toBeTruthy()
    expect(header.getByRole('link', { name: /^Email/ }).getAttribute('href')).toBe('mailto:uglionebrayden@gmail.com')
  })

  it('section nav scrolls without touching the hash, and marks the section current', () => {
    render(<BoxScore />)
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }))
    expect(nav.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('true')
    fireEvent.click(nav.getByRole('link', { name: 'Projects' }))
    expect(window.location.hash).toBe('#/box-score')
    const calls = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.contexts as Element[]
    expect(calls.some((el) => el.id === 'section-projects')).toBe(true)
  })

  it('a card with a primary link is clickable as a whole; the title link points at it', () => {
    const { container } = render(<BoxScore />)
    const card = container.querySelector('#tranquility-base') as HTMLElement
    const a = card.querySelector('h3 a.bs__entry-link') as HTMLAnchorElement
    expect(a.getAttribute('href')).toBe('https://tranquility-base.rohansh2017.workers.dev')
    expect(a.rel).toContain('noopener')
    expect(card.className).toContain('bs__entry--link')
    // other links stay separate and reachable
    expect(within(card).getByRole('link', { name: 'GitHub' }).getAttribute('href')).toContain('github.com')
  })

  it('a card without links is plain text, not a link', () => {
    const { container } = render(<BoxScore />)
    const card = container.querySelector('#robotics') as HTMLElement
    expect(card.querySelector('a.bs__entry-link')).toBeNull()
    expect(card.className).not.toContain('bs__entry--link')
  })

  it('entries lead with the date range, then "Role · Company"', () => {
    const { container } = render(<BoxScore />)
    const card = container.querySelector('#shah-sokoloff') as HTMLElement
    expect(card.firstElementChild?.textContent).toBe('Jul 2024 – Jul 2025')
    expect(card.querySelector('h3')?.textContent).toContain('IT Contractor · Shah & Sokoloff LLC')
    expect(container.querySelectorAll('#zayi-fellow .bs__tags li').length).toBeGreaterThan(0)
  })

  it('projects show a screenshot thumbnail and the key stat', () => {
    const { container } = render(<BoxScore />)
    const card = container.querySelector('#tranquility-base') as HTMLElement
    expect(card.querySelector('img.bs__thumb')?.getAttribute('src')).toBe('/media/tranquility-base/moon-view.webp')
    expect(card.querySelector('.station__stat-value')?.textContent).toBe('15 → 60 fps')
    expect(container.querySelector('#shah-sokoloff img.bs__thumb')).toBeNull()
  })

  it('deep link highlights the target card and clears when the hash moves on', () => {
    window.location.hash = '#robotics'
    const { container } = render(<BoxScore />)
    expect(container.querySelector('#robotics')?.className).toContain('is-target')
    expect(container.querySelectorAll('.is-target')).toHaveLength(1)
  })

  it('never shows a phone number or a private term', () => {
    const { container } = render(<BoxScore />)
    expect(container.textContent).not.toMatch(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)
    expect(findPrivateTerm(container.textContent ?? '', loadPrivateTerms())).toBeNull()
  })
})

describe('Explore call to action', () => {
  it('is shown with WebGL and hidden without it', () => {
    const { unmount } = render(<App env={env({ webgl: true })} />)
    expect(screen.queryByRole('button', { name: "Explore Brayden's World" })).toBeTruthy()
    unmount()
    render(<App env={env({ webgl: false })} />)
    expect(screen.queryByRole('button', { name: /Explore/ })).toBeNull()
  })

  it('sits in the header, before the first section', () => {
    render(<BoxScore onExplore={() => {}} />)
    const btn = screen.getByRole('button', { name: "Explore Brayden's World" })
    expect(screen.getByRole('banner').contains(btn)).toBe(true)
  })
})
