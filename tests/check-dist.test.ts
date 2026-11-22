import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error untyped mjs
import { PHONE_RE, checkDist } from '../scripts/check-dist.mjs'
import { PHONE_PATTERN } from '../src/content'

const TERMS = ['555-0199', 'fakecorp']

function fixture(extra: Record<string, string> = {}) {
  const d = mkdtempSync(join(tmpdir(), 'dist-'))
  mkdirSync(join(d, 'assets'))
  writeFileSync(join(d, 'assets', 'a.js'), 'console.log(1)')
  writeFileSync(join(d, 'index.html'), '<script type="module" src="/assets/a.js"></script>')
  for (const [k, v] of Object.entries(extra)) writeFileSync(join(d, k), v)
  return d
}

describe('check-dist', () => {
  it('phone regex matches content PHONE_PATTERN', () => {
    expect(PHONE_RE.source).toBe(PHONE_PATTERN.source)
  })
  it('passes a clean dist', () => {
    const r = checkDist(fixture(), TERMS)
    expect(r.errors).toEqual([])
    expect(r.jsGzipBytes).toBeGreaterThan(0)
  })
  it('fails on a phone number', () => {
    expect(checkDist(fixture({ 'x.txt': 'call 609-555-1234' }), TERMS).errors.length).toBe(1)
  })
  it('fails on a private term (case-insensitive)', () => {
    expect(checkDist(fixture({ 'x.txt': 'n 555-0199' }), TERMS).errors.length).toBe(1)
    expect(checkDist(fixture({ 'x.txt': 'at FakeCorp' }), TERMS).errors.length).toBe(1)
  })
  it('fails on a pdf', () => {
    expect(checkDist(fixture({ 'resume.pdf': 'x' }), TERMS).errors.length).toBeGreaterThan(0)
  })
  it('fails when a module script is present but no JS is measured', () => {
    const d = fixture()
    writeFileSync(join(d, 'index.html'), '<script type="module">inline()</script>')
    expect(checkDist(d, TERMS).errors.length).toBe(1)
  })
})
