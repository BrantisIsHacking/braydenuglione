import { describe, expect, it } from 'vitest'
import { canRunArena, hasWebGL, readEnv, type Env } from '../src/routing/capability'

const fakeDoc = (getContext: (k: string) => unknown) =>
  ({ createElement: () => ({ getContext }) }) as unknown as Document
const desktop: Env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 }

describe('hasWebGL', () => {
  it('false when no context', () => expect(hasWebGL(fakeDoc(() => null))).toBe(false))
  it('true for webgl2', () => expect(hasWebGL(fakeDoc((k) => (k === 'webgl2' ? {} : null)))).toBe(true))
  it('false when getContext throws', () =>
    expect(
      hasWebGL(
        fakeDoc(() => {
          throw new Error('x')
        }),
      ),
    ).toBe(false))
})

describe('readEnv', () => {
  it('does not throw without matchMedia', () => {
    const win = { document: fakeDoc(() => ({})), screen: { width: 1000, height: 600 } } as unknown as Window
    expect(readEnv(win)).toMatchObject({ webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 600 })
  })
})

describe('canRunArena', () => {
  it('desktop true', () => expect(canRunArena(desktop)).toBe(true))
  it('phone false', () => expect(canRunArena({ ...desktop, coarsePointer: true, shortSide: 412 })).toBe(false))
  it('tablet true', () => expect(canRunArena({ ...desktop, coarsePointer: true, shortSide: 820 })).toBe(true))
  it('reduced motion false', () => expect(canRunArena({ ...desktop, reducedMotion: true })).toBe(false))
  it('no webgl false', () => expect(canRunArena({ ...desktop, webgl: false })).toBe(false))
  it('low memory false, 4 true', () => {
    expect(canRunArena({ ...desktop, deviceMemory: 2 })).toBe(false)
    expect(canRunArena({ ...desktop, deviceMemory: 4 })).toBe(true)
  })
})

describe('hasWebGL cleanup', () => {
  it('releases the probe context', () => {
    let lost = 0
    const ctx = { getExtension: () => ({ loseContext: () => void lost++ }) }
    expect(hasWebGL(fakeDoc(() => ctx))).toBe(true)
    expect(lost).toBe(1)
  })
})
