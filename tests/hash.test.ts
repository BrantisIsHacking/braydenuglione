import { describe, expect, it } from 'vitest'
import { parseHash, toHash } from '../src/routing/hash'

describe('hash routing', () => {
  it('empty and box-score hashes have no station', () => {
    expect(parseHash('')).toEqual({ view: 'boxscore', stationId: null })
    expect(parseHash('#/box-score')).toEqual({ view: 'boxscore', stationId: null })
  })
  it('valid station id is returned', () => {
    expect(parseHash('#tranquility-base')).toEqual({ view: 'boxscore', stationId: 'tranquility-base' })
  })
  it('unknown or hostile ids yield null', () => {
    expect(parseHash('#tranqility-base').stationId).toBeNull()
    expect(parseHash('#<script>').stationId).toBeNull()
  })
  it('toHash builds a fragment', () => {
    expect(toHash('robotics')).toBe('#robotics')
  })
})
