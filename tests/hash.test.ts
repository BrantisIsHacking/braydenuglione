import { describe, expect, it } from 'vitest'
import { parseHash, resolveView, toHash, type Route } from '../src/routing/hash'
import type { Env } from '../src/routing/capability'

const desktop: Env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 }
const phone: Env = { webgl: true, reducedMotion: false, coarsePointer: true, shortSide: 412 }
const noGl: Env = { ...desktop, webgl: false }

describe('hash routing', () => {
  it('empty hashes are auto with no station', () => {
    for (const h of ['', '#', '#/']) expect(parseHash(h)).toEqual({ view: 'auto', stationId: null })
  })
  it('explicit views', () => {
    expect(parseHash('#/box-score')).toEqual({ view: 'boxscore', stationId: null })
    expect(parseHash('#/arena')).toEqual({ view: 'arena', stationId: null })
  })
  it('valid station id is auto + id', () => {
    expect(parseHash('#tranquility-base')).toEqual({ view: 'auto', stationId: 'tranquility-base' })
  })
  it('unknown or hostile ids yield auto, null', () => {
    for (const h of ['#tranqility-base', '#<script>', '#/arena/x']) expect(parseHash(h)).toEqual({ view: 'auto', stationId: null })
  })
  it('toHash builds a fragment', () => {
    expect(toHash('robotics')).toBe('#robotics')
  })
  const cases: [string, Env, Route['view'], 'boxscore' | 'arena'][] = [
    ['desktop', desktop, 'boxscore', 'boxscore'],
    ['desktop', desktop, 'arena', 'arena'],
    ['desktop', desktop, 'auto', 'arena'],
    ['phone', phone, 'boxscore', 'boxscore'],
    ['phone', phone, 'arena', 'arena'],
    ['phone', phone, 'auto', 'boxscore'],
    ['no-webgl', noGl, 'boxscore', 'boxscore'],
    ['no-webgl', noGl, 'arena', 'boxscore'],
    ['no-webgl', noGl, 'auto', 'boxscore'],
  ]
  it.each(cases)('resolveView %s %s -> %s', (_n, env, view, out) => {
    expect(resolveView({ view, stationId: null }, env)).toBe(out)
  })
})
