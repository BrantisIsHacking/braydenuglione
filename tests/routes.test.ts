import { describe, expect, it } from 'vitest'
import { parseRoute, resolveScreen, needsStartScreen, hashForRoute, type Route } from '../src/routing/routes'
import type { Env } from '../src/routing/capability'

const desktop: Env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 }
const phone: Env = { ...desktop, coarsePointer: true, shortSide: 412 }
const noGl: Env = { ...desktop, webgl: false }
const reduced: Env = { ...desktop, reducedMotion: true }

describe('parseRoute', () => {
  const auto: Route = { view: 'auto' }
  const cases: [string, Route][] = [
    ['', auto], ['#', auto], ['#/', auto],
    ['#/world', { view: 'world' }],
    ['#/box-score', { view: 'boxscore' }],
    ['#/arena', { view: 'building', id: 'gym', legacy: true }],
    ['#/b/gym', { view: 'building', id: 'gym', legacy: false }],
    ['#/b/library', { view: 'building', id: 'library', legacy: false }],
    ['#/b/chess-park', { view: 'building', id: 'chess-park', legacy: false }],
    ['#/b/scouting-office', { view: 'boxscore' }],
    ['#/b/', auto], ['#/b/nope', auto], ['#/b/tranquility-base', auto], ['#/arena/x', auto],
    ['#tranquility-base', { view: 'exhibit', id: 'tranquility-base' }],
    ['#books', { view: 'exhibit', id: 'books' }],
    ['#contact', { view: 'exhibit', id: 'contact' }],
    ['#rising-star', { view: 'exhibit', id: 'rising-star' }],
    ['#gym', auto], ['#Tranquility-Base', auto], ['#<script>', auto], ['#%E0%A4%A', auto],
    ['#critics%2Dchoice', { view: 'exhibit', id: 'critics-choice' }],
  ]
  it.each(cases)('%s', (h, r) => expect(parseRoute(h)).toEqual(r))
})

describe('resolveScreen', () => {
  const views: Route[] = [
    { view: 'auto' }, { view: 'boxscore' }, { view: 'world' },
    { view: 'building', id: 'gym', legacy: false }, { view: 'exhibit', id: 'books' },
  ]
  const envs: [string, Env][] = [['desktop', desktop], ['phone', phone], ['noGl', noGl], ['reduced', reduced]]
  for (const [name, env] of envs) {
    for (const r of views) {
      it(`${name} ${r.view}`, () => {
        const canRun = env.webgl && !env.reducedMotion && !(env.coarsePointer && env.shortSide < 768)
        const want = r.view === 'boxscore' ? 'boxscore'
          : r.view === 'world' || r.view === 'building' ? (env.webgl ? 'world' : 'boxscore')
          : canRun ? 'world' : 'boxscore'
        expect(resolveScreen(r, env)).toBe(want)
      })
    }
  }
})

describe('needsStartScreen', () => {
  it('table', () => {
    expect(needsStartScreen({ view: 'auto' }, false)).toBe(true)
    expect(needsStartScreen({ view: 'world' }, false)).toBe(true)
    expect(needsStartScreen({ view: 'boxscore' }, false)).toBe(false)
    expect(needsStartScreen({ view: 'building', id: 'gym', legacy: false }, false)).toBe(false)
    expect(needsStartScreen({ view: 'exhibit', id: 'books' }, false)).toBe(false)
    expect(needsStartScreen({ view: 'auto' }, true)).toBe(false)
    expect(needsStartScreen({ view: 'world' }, true)).toBe(false)
  })
})

describe('hashForRoute', () => {
  it.each(['#/', '#/box-score', '#/world', '#/b/gym', '#/b/chess-park', '#books', '#critics-choice'])('round-trips %s', (h) => {
    expect(hashForRoute(parseRoute(h))).toBe(h)
  })
})

describe('floor routes', () => {
  const hq = { view: 'building', id: 'hq-tower', legacy: false } as const
  it('parses a valid floor', () => {
    expect(parseRoute('#/b/hq-tower/3')).toEqual({ ...hq, floor: 3 })
    expect(parseRoute('#/b/hq-tower/1')).toEqual({ ...hq, floor: 1 })
  })
  it.each(['#/b/hq-tower/0', '#/b/hq-tower/5', '#/b/hq-tower/2.5', '#/b/hq-tower/x', '#/b/hq-tower/', '#/b/hq-tower/2/x', '#/b/hq-tower/-1'])('hostile %s lands on the lobby', (h) => {
    const r = parseRoute(h)
    expect(r).toEqual(hq)
    expect('floor' in r).toBe(false)
  })
  it('floors only exist on multi-floor buildings; unknown buildings go to auto', () => {
    expect(parseRoute('#/b/gym/2')).toEqual({ view: 'building', id: 'gym', legacy: false })
    expect(parseRoute('#/b/nope/2')).toEqual({ view: 'auto' })
  })
  it('hashForRoute writes floors >= 2 only', () => {
    expect(hashForRoute({ ...hq, floor: 3 })).toBe('#/b/hq-tower/3')
    expect(hashForRoute({ ...hq, floor: 1 })).toBe('#/b/hq-tower')
    expect(hashForRoute(hq)).toBe('#/b/hq-tower')
  })
})
