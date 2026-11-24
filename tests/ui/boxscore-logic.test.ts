import { describe, expect, it } from 'vitest'
import { stations } from '../../src/content'
import { entryHeading, pickActive, primaryLink, SECTIONS, sortByRecency } from '../../src/boxscore/logic'

const st = (id: string) => stations.find((s) => s.id === id)!

describe('primaryLink', () => {
  it('is the first link of the station, or undefined when there is none', () => {
    expect(primaryLink(st('tranquility-base'))?.url).toBe('https://tranquility-base.rohansh2017.workers.dev')
    const none = stations.find((s) => s.links.length === 0)
    expect(none).toBeTruthy()
    expect(primaryLink(none!)).toBeUndefined()
  })
})

describe('entryHeading', () => {
  it('projects use the title alone, with org and role as the sub line', () => {
    expect(entryHeading(st('tranquility-base'))).toEqual({ title: 'Tranquility Base', sub: 'NASA Space Apps NYC 2026 · Developer (team of 4)' })
    expect(entryHeading(st('debate-mate'))).toEqual({ title: 'DebateMate', sub: 'HackRU 2025' })
  })
  it('jobs read "Role · Company"', () => {
    expect(entryHeading(st('shah-sokoloff')).title).toBe('IT Contractor · Shah & Sokoloff LLC')
    expect(entryHeading(st('hackru')).title).toBe('Head of Judging Operations · HackRU')
  })
  it('drops an org that is already in the title or is a placeholder', () => {
    expect(entryHeading(st('rutgers-honors')).title).toBe('Rutgers University – Honors College')
    expect(entryHeading(st('teaching-mentoring')).title).toBe('Teaching & Mentoring')
  })
})

describe('sortByRecency', () => {
  it('puts present roles first, then newest end date, then newest start, stably', () => {
    const list = ['oculogica', 'code-ninjas', 'zayi-fellow', 'shah-sokoloff', 'calc-ii-la'].map(st)
    expect(sortByRecency(list).map((s) => s.id)).toEqual(['zayi-fellow', 'calc-ii-la', 'code-ninjas', 'shah-sokoloff', 'oculogica'])
  })
  it('does not mutate its input', () => {
    const list = ['oculogica', 'zayi-fellow'].map(st)
    sortByRecency(list)
    expect(list.map((s) => s.id)).toEqual(['oculogica', 'zayi-fellow'])
  })
})

describe('SECTIONS', () => {
  it('are in recruiter order', () => {
    expect(SECTIONS.map((s) => s.label)).toEqual(['About', 'Experience', 'Projects', 'Leadership', 'Education', 'Awards', 'Off the clock', 'Contact'])
  })
})

describe('pickActive', () => {
  const order = ['a', 'b', 'c', 'd']
  it('chooses the last intersecting section in page order', () => {
    expect(pickActive(order, new Set(['b', 'c']), 'a', false)).toBe('c')
  })
  it('keeps the previous section when nothing intersects', () => {
    expect(pickActive(order, new Set(), 'b', false)).toBe('b')
  })
  it('falls back to the first section with no history', () => {
    expect(pickActive(order, new Set(), '', false)).toBe('a')
  })
  it('selects the last section when the page end is visible', () => {
    expect(pickActive(order, new Set(['b']), 'b', true)).toBe('d')
  })
})
