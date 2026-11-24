import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error untyped mjs
import { PHONE_RE, checkDist, glbJson, chunkGroups, CHUNK_TARGETS, missingSceneEntries } from '../scripts/check-dist.mjs'
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
  it('fails when three.js is in the initial bundle', () => {
    const d = fixture()
    writeFileSync(join(d, 'assets', 'a.js'), 'new WebGLRenderer()')
    expect(checkDist(d, TERMS).errors).toEqual(['three.js in initial bundle'])
  })
  it('allows three.js in a non-initial chunk', () => {
    expect(checkDist(fixture({ 'assets/arena.js': 'new WebGLRenderer()' }), TERMS).errors).toEqual([])
  })
  it('fails when over the total budget', () => {
    const r = checkDist(fixture(), TERMS, { totalBudget: 10 })
    expect(r.errors.some((e: string) => e.includes('arena total'))).toBe(true)
  })
  it('reports total gzip bytes', () => {
    expect(checkDist(fixture(), TERMS).totalGzipBytes).toBeGreaterThan(0)
  })
  it('fails when a module script is present but no JS is measured', () => {
    const d = fixture()
    writeFileSync(join(d, 'index.html'), '<script type="module">inline()</script>')
    expect(checkDist(d, TERMS).errors.length).toBe(1)
  })
})

function glb(json: string) {
  const j = Buffer.from(json)
  const pad = (4 - (j.length % 4)) % 4
  const jb = Buffer.concat([j, Buffer.alloc(pad, 0x20)])
  const h = Buffer.alloc(20)
  h.write('glTF', 0)
  h.writeUInt32LE(2, 4)
  h.writeUInt32LE(20 + jb.length, 8)
  h.writeUInt32LE(jb.length, 12)
  h.write('JSON', 16)
  return Buffer.concat([h, jb])
}
function modelFixture(buf: Buffer) {
  const d = fixture()
  mkdirSync(join(d, 'models'))
  writeFileSync(join(d, 'models', 'x.glb'), buf)
  return d
}

describe('check-dist models', () => {
  it('glbJson parses a glb and rejects junk', () => {
    expect(glbJson(glb('{"a":1}'))).toContain('"a":1')
    expect(glbJson(Buffer.from('nope'))).toBeNull()
  })
  it('flags a phone number in glb JSON', () => {
    const r = checkDist(modelFixture(glb('{"extras":"555-123-4567"}')), TERMS)
    expect(r.errors.some((e: string) => e.includes('phone-like number in models'))).toBe(true)
  })
  it('flags a private term in glb JSON', () => {
    const r = checkDist(modelFixture(glb('{"extras":"fakecorp"}')), TERMS)
    expect(r.errors.some((e: string) => e.includes('private term'))).toBe(true)
  })
  it('flags a glb over budget', () => {
    const r = checkDist(modelFixture(glb('{"a":1}')), TERMS, { modelBudget: 10 })
    expect(r.errors.some((e: string) => e.includes('model over budget'))).toBe(true)
  })
  it('counts models in the total', () => {
    const base = checkDist(fixture(), TERMS).totalGzipBytes
    expect(checkDist(modelFixture(glb('{"a":"' + 'x'.repeat(2000) + '"}')), TERMS).totalGzipBytes).toBeGreaterThan(base)
  })
})

describe('check-dist chunk groups', () => {
  const manifest = {
    'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_vendor-react.js'] },
    '_vendor-react.js': { file: 'assets/vendor-react.js' },
    'src/world/WorldApp.tsx': { file: 'assets/WorldApp.js', isDynamicEntry: true, imports: ['_engine-a.js', '_vendor-react.js'] },
    '_engine-a.js': { file: 'assets/engine-a.js' },
    'src/world/interiors/generic/Interior.tsx': { file: 'assets/generic.js', isDynamicEntry: true, imports: ['_kit-b.js'] },
    'src/world/interiors/gym/Interior.tsx': { file: 'assets/gym.js', isDynamicEntry: true, imports: ['_kit-b.js'] },
    '_kit-b.js': { file: 'assets/kit-b.js' },
  }
  function withManifest(m: object, sizes: Record<string, string> = {}) {
    const d = fixture()
    mkdirSync(join(d, '.vite'))
    writeFileSync(join(d, '.vite', 'manifest.json'), JSON.stringify(m))
    for (const [k, v] of Object.entries(sizes)) writeFileSync(join(d, k), v)
    return d
  }
  it('groups engine and interiors, subtracting initial', () => {
    const g = chunkGroups(manifest) as { name: string; files: string[] }[]
    const by = Object.fromEntries(g.map((x) => [x.name, x.files.sort()]))
    expect(by.engine).toEqual(['assets/WorldApp.js', 'assets/engine-a.js'])
    expect(by['interior-generic']).toContain('assets/kit-b.js')
    expect(by['interior-gym']).toContain('assets/kit-b.js')
    expect(by.engine).not.toContain('assets/vendor-react.js')
  })
  it('exposes targets', () => {
    expect(CHUNK_TARGETS['interior-gym']).toBe(150 * 1024)
  })
  it('warns (not errors) when gym exceeds target', () => {
    const noise = Array.from({ length: 40000 }, (_, i) => (i * 2654435761 % 4294967296).toString(36)).join(',')
    const d = withManifest(manifest, { 'assets/gym.js': noise })
    const r = checkDist(d, TERMS, { chunkTargets: { 'interior-gym': 1024 } })
    expect(r.errors).toEqual([])
    expect(r.warnings.some((w: string) => w.includes('interior-gym'))).toBe(true)
    expect(r.groups.some((x: { name: string }) => x.name === 'interior-gym')).toBe(true)
  })
  it('warns when a scene entry key is missing from the manifest', () => {
    const stage2 = ['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame', 'cinema'].map((id) => `src/world/interiors/${id}/Interior.tsx`)
    expect(missingSceneEntries(manifest)).toEqual(['src/world/world/WorldScene.tsx', ...stage2])
    const r = checkDist(withManifest(manifest), TERMS)
    expect(r.errors).toEqual([])
    expect(r.warnings).toContain('scene entry src/world/world/WorldScene.tsx missing from manifest; its chunk target is not checked')
    // a manifest with every entry but one reports exactly that one
    const full: Record<string, unknown> = { ...manifest, 'src/world/world/WorldScene.tsx': { file: 'assets/ws.js', isDynamicEntry: true } }
    for (const k of stage2) full[k] = { file: `assets/${k.split('/')[3]}.js`, isDynamicEntry: true }
    expect(missingSceneEntries(full)).toEqual([])
    delete full['src/world/interiors/hall-of-fame/Interior.tsx']
    expect(missingSceneEntries(full)).toEqual(['src/world/interiors/hall-of-fame/Interior.tsx'])
    const r2 = checkDist(withManifest(full), TERMS)
    expect(r2.warnings).toContain('scene entry src/world/interiors/hall-of-fame/Interior.tsx missing from manifest; its chunk target is not checked')
  })
  it('finds an engine entry keyed by chunk name (also imported statically by the scenes)', () => {
    const m = { ...manifest } as Record<string, unknown>
    m['_WorldApp-x.js'] = { file: 'assets/WorldApp.js', name: 'WorldApp', isDynamicEntry: true, imports: ['_engine-a.js'] }
    delete m['src/world/WorldApp.tsx']
    const by = Object.fromEntries((chunkGroups(m) as { name: string; files: string[] }[]).map((x) => [x.name, x.files.sort()]))
    expect(by.engine).toEqual(['assets/WorldApp.js', 'assets/engine-a.js'])
    expect(missingSceneEntries(m)).not.toContain('src/world/WorldApp.tsx')
  })
  it('warns when manifest is missing', () => {
    expect(checkDist(fixture(), TERMS).warnings).toEqual(['no manifest; chunk targets skipped'])
  })
  it('initial over budget still errors', () => {
    const d = withManifest(manifest)
    expect(checkDist(d, TERMS, { jsBudget: 1 }).errors.some((e: string) => e.includes('exceeds'))).toBe(true)
  })
})
