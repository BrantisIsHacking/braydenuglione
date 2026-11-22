// Private-terms scan helpers. Terms come from env PRIVATE_TERMS (comma-separated)
// or the gitignored file _source/private-terms.txt (one per line, # comments).
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function loadPrivateTerms() {
  const env = process.env.PRIVATE_TERMS
  let raw = []
  if (env && env.trim()) raw = env.split(',')
  else {
    const f = join(ROOT, '_source', 'private-terms.txt')
    if (existsSync(f)) raw = readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => !l.trim().startsWith('#'))
  }
  return raw.map((t) => t.trim()).filter(Boolean)
}

export function findPrivateTerm(text, terms) {
  const hay = String(text).toLowerCase()
  for (const t of terms) if (hay.includes(t.toLowerCase())) return t
  return null
}
