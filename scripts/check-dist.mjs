import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { loadPrivateTerms, findPrivateTerm } from '../src/privacy/privateTerms.mjs'

// Must stay identical to PHONE_PATTERN in src/content/index.ts (enforced by tests/check-dist.test.ts).
export const PHONE_RE = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/
const TEXT_EXT = new Set(['.html', '.js', '.css', '.json', '.txt', '.svg', '.xml', '.map', '.webmanifest', ''])
const BUDGET = 200 * 1024
const TOTAL_BUDGET = 5 * 1024 * 1024

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

export function checkDist(dist, terms = loadPrivateTerms(), opts = {}) {
  const jsBudget = opts.jsBudget ?? BUDGET
  const totalBudget = opts.totalBudget ?? TOTAL_BUDGET
  const errors = []
  for (const f of walk(dist)) {
    const rel = f.slice(dist.length + 1)
    const ext = extname(f).toLowerCase()
    if (ext === '.pdf') errors.push(`PDF in dist: ${rel}`)
    if (!TEXT_EXT.has(ext) && ext !== '.pdf') continue
    const t = readFileSync(f, 'utf8')
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
  if (existsSync(assets)) for (const f of walk(assets)) totalGzipBytes += gzipSync(readFileSync(f)).length
  if (totalGzipBytes > totalBudget) errors.push(`arena total ${(totalGzipBytes / 1024).toFixed(1)} KB gzip over budget`)
  return { errors, jsGzipBytes, totalGzipBytes }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, jsGzipBytes, totalGzipBytes } = checkDist(resolve('dist'))
  console.log(`JS gzip size: ${(jsGzipBytes / 1024).toFixed(1)} KB (budget 200 KB)`)
  console.log(`Arena total gzip: ${(totalGzipBytes / 1024).toFixed(1)} KB (budget 5120 KB)`)
  if (errors.length) {
    for (const e of errors) console.error('FAIL: ' + e)
    process.exit(1)
  }
  console.log('dist checks passed')
}
