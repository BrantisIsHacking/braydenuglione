import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { loadPrivateTerms, findPrivateTerm } from '../src/privacy/privateTerms.mjs'

// Must stay identical to PHONE_PATTERN in src/content/index.ts (enforced by tests/check-dist.test.ts).
export const PHONE_RE = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.txt', '.svg', '.xml', '.map', '.webmanifest', ''])
const MODEL_BUDGET = 400_000 // = PLAYER_GLB_MAX_BYTES in avatarConfig.ts
const BUDGET = 200 * 1024
const TOTAL_BUDGET = 5 * 1024 * 1024

export const CHUNK_TARGETS = { engine: 400 * 1024, 'world-scene': 150 * 1024, 'interior-gym': 150 * 1024, interior: 120 * 1024 }
export const SCENE_ENTRIES = { engine: 'src/world/WorldApp.tsx', 'world-scene': 'src/world/world/WorldScene.tsx', interiorGlob: /^src\/world\/interiors\/([^/]+)\/Interior\.tsx$/ }

/** Manifest keys every build must contain; a missing one means a chunk target silently stopped being checked. */
export const REQUIRED_SCENE_KEYS = [SCENE_ENTRIES.engine, SCENE_ENTRIES['world-scene'], 'src/world/interiors/generic/Interior.tsx', 'src/world/interiors/gym/Interior.tsx', ...['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame', 'cinema', 'library', 'arcade', 'record-store', 'playhouse', 'fan-shop', 'golf-clubhouse'].map((id) => `src/world/interiors/${id}/Interior.tsx`)]

/**
 * Manifest key for a source entry. A dynamic entry that other chunks also import statically (WorldApp: the scene
 * chunks share its store/kit) is keyed `_<Name>-<hash>.js` with `name` set, not by its source path.
 */
export function sceneKey(manifest, src) {
  if (manifest[src]) return src
  const name = src.split('/').pop().replace(/\.[^.]+$/, '')
  return Object.keys(manifest).find((k) => k.startsWith('_') && manifest[k].isDynamicEntry && manifest[k].name === name)
}

export function missingSceneEntries(manifest) {
  return REQUIRED_SCENE_KEYS.filter((k) => !sceneKey(manifest, k))
}

function closure(manifest, key, seen = new Set()) {
  if (seen.has(key) || !manifest[key]) return seen
  seen.add(key)
  for (const i of manifest[key].imports ?? []) closure(manifest, i, seen)
  return seen
}
const filesOf = (manifest, keys) => new Set([...keys].map((k) => manifest[k].file))

export function chunkGroups(manifest) {
  const entry = Object.keys(manifest).find((k) => manifest[k].isEntry)
  const initial = entry ? filesOf(manifest, closure(manifest, entry)) : new Set()
  const out = []
  const engine = new Set()
  const add = (name, key, minus) => {
    if (!manifest[key]) return new Set()
    const files = [...filesOf(manifest, closure(manifest, key))].filter((f) => !initial.has(f) && !minus.has(f))
    out.push({ name, files })
    return new Set(files)
  }
  const engineKey = sceneKey(manifest, SCENE_ENTRIES.engine)
  if (engineKey) for (const f of add('engine', engineKey, new Set())) engine.add(f)
  if (manifest[SCENE_ENTRIES['world-scene']]) add('world-scene', SCENE_ENTRIES['world-scene'], engine)
  for (const key of Object.keys(manifest)) {
    const m = SCENE_ENTRIES.interiorGlob.exec(key)
    if (m) add(`interior-${m[1]}`, key, engine)
  }
  return out
}

export function glbJson(buf) {
  if (buf.length < 20 || buf.toString('latin1', 0, 4) !== 'glTF') return null
  if (buf.toString('latin1', 16, 20) !== 'JSON') return null
  const len = buf.readUInt32LE(12)
  if (20 + len > buf.length) return null
  return buf.toString('utf8', 20, 20 + len)
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

export function checkDist(dist, terms = loadPrivateTerms(), opts = {}) {
  const jsBudget = opts.jsBudget ?? BUDGET
  const totalBudget = opts.totalBudget ?? TOTAL_BUDGET
  const modelBudget = opts.modelBudget ?? MODEL_BUDGET
  const errors = []
  for (const f of walk(dist)) {
    const rel = f.slice(dist.length + 1)
    const ext = extname(f).toLowerCase()
    if (ext === '.pdf') errors.push(`PDF in dist: ${rel}`)
    let t
    if (ext === '.glb') {
      const buf = readFileSync(f)
      if (buf.length > modelBudget) errors.push(`model over budget: ${rel}`)
      t = glbJson(buf)
      if (t === null) continue
    } else {
      if (!TEXT_EXT.has(ext) && ext !== '.pdf') continue
      t = readFileSync(f, 'utf8')
    }
    if (PHONE_RE.test(t)) errors.push(`phone-like number in ${rel}`)
    if (findPrivateTerm(t, terms)) errors.push(`private term in ${rel}`)
  }
  let jsGzipBytes = 0
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const refs = [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1])
  for (const r of refs) {
    if (/^https?:/.test(r)) continue
    const js = readFileSync(join(dist, r.replace(/^\//, '')), 'utf8')
    if (js.includes('WebGLRenderer') && !errors.includes('three.js in initial bundle')) errors.push('three.js in initial bundle')
    jsGzipBytes += gzipSync(js).length
  }
  if (/<script[^>]*type="module"/.test(html) && refs.length === 0) errors.push('index.html has a module script but no JS refs were measured')
  if (jsGzipBytes > jsBudget) errors.push(`JS ${(jsGzipBytes / 1024).toFixed(1)} KB gzip exceeds ${(jsBudget / 1024).toFixed(0)} KB`)
  let totalGzipBytes = 0
  const assets = join(dist, 'assets')
  for (const sub of [assets, join(dist, 'models')]) {
    if (existsSync(sub)) for (const f of walk(sub)) totalGzipBytes += gzipSync(readFileSync(f)).length
  }
  if (totalGzipBytes > totalBudget) errors.push(`arena total ${(totalGzipBytes / 1024).toFixed(1)} KB gzip over budget`)
  const warnings = []
  const groups = []
  const mpath = join(dist, '.vite', 'manifest.json')
  if (!existsSync(mpath)) warnings.push('no manifest; chunk targets skipped')
  else {
    const targets = { ...CHUNK_TARGETS, ...(opts.chunkTargets ?? {}) }
    const manifest = JSON.parse(readFileSync(mpath, 'utf8'))
    for (const k of missingSceneEntries(manifest)) warnings.push(`scene entry ${k} missing from manifest; its chunk target is not checked`)
    for (const g of chunkGroups(manifest)) {
      let gzipBytes = 0
      for (const f of g.files) {
        const p = join(dist, f)
        if (f.endsWith('.js') && existsSync(p)) gzipBytes += gzipSync(readFileSync(p)).length
      }
      groups.push({ name: g.name, gzipBytes })
      const target = targets[g.name] ?? (g.name.startsWith('interior-') ? targets.interior : undefined)
      if (target !== undefined && gzipBytes > target) warnings.push(`chunk ${g.name} ${(gzipBytes / 1024).toFixed(1)} KB gzip over target ${(target / 1024).toFixed(0)} KB`)
    }
  }
  return { errors, warnings, groups, jsGzipBytes, totalGzipBytes }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const terms = loadPrivateTerms()
  if (terms.length === 0) console.warn('WARNING: private-terms list is empty (no PRIVATE_TERMS env var and no _source/private-terms.txt); the private-terms scan was SKIPPED.')
  const { errors, warnings, groups, jsGzipBytes, totalGzipBytes } = checkDist(resolve('dist'), terms)
  console.log(`JS gzip size: ${(jsGzipBytes / 1024).toFixed(1)} KB (budget 200 KB)`)
  console.log(`Arena total gzip: ${(totalGzipBytes / 1024).toFixed(1)} KB (budget 5120 KB)`)
  for (const g of groups) console.log(`chunk ${g.name}: ${(g.gzipBytes / 1024).toFixed(1)} KB gzip`)
  for (const w of warnings) console.warn('warn: ' + w)
  if (errors.length) {
    for (const e of errors) console.error('FAIL: ' + e)
    process.exit(1)
  }
  rmSync(resolve('dist', '.vite'), { recursive: true, force: true })
  console.log('dist checks passed')
}
