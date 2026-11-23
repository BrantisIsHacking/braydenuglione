// Builds public/models/player.glb from private CC0 Quaternius packs in _source/models/.
// usage: npm run models
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { dedup, prune, resample, weld, meshopt, join as joinPrims } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

export const KEEP_CLIPS = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop', 'Jump_Start', 'Jump_Loop', 'Jump_Land', 'Spell_Simple_Shoot']
const MAX_BYTES = 400_000 // = PLAYER_GLB_MAX_BYTES in avatarConfig.ts
const HERE = dirname(fileURLToPath(import.meta.url))
const SRC_ROOT = resolve(HERE, '..', '_source', 'models')
const SRC_BODY = 'ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'
const SRC_ANIMS = 'ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'
const OUT = resolve(HERE, '..', 'public', 'models', 'player.glb')

const srgb = (c) => c.map((v) => Math.pow(v, 2.2)) // linear factors from sRGB-ish values
const COL = { Skin: [0.78, 0.52, 0.36], Jersey: [0.8, 0, 0.2], Shorts: [0.1, 0.1, 0.12], Hair: [0.18, 0.12, 0.09], Eyes: [0.08, 0.08, 0.09] }

export function stripTextures(json) {
  const out = JSON.parse(JSON.stringify(json))
  delete out.images
  delete out.textures
  delete out.samplers
  const scrub = (o) => {
    if (!o || typeof o !== 'object') return
    for (const k of Object.keys(o)) {
      if (/Texture$/.test(k)) delete o[k]
      else scrub(o[k])
    }
  }
  scrub(out.materials)
  if (out.extensionsUsed) out.extensionsUsed = out.extensionsUsed.filter((e) => e !== 'KHR_texture_transform')
  return out
}

export function classifyTriangle({ rel, xAbsRel, joint }) {
  if (/^(upperarm|lowerarm|hand)/.test(joint)) return 'Skin'
  if (/^spine_0[123]$/.test(joint) && rel > 0.52) return 'Jersey'
  if (/^clavicle_/.test(joint) && xAbsRel < 0.11) return 'Jersey'
  if (/^(pelvis|thigh_[lr])$/.test(joint) && rel > 0.4 && rel < 0.56) return 'Shorts'
  if (/^spine_01$/.test(joint) && rel > 0.4 && rel <= 0.52) return 'Shorts'
  return 'Skin'
}

export function smoothLabels(labels, adjacency, passes) {
  let cur = labels.slice()
  for (let p = 0; p < passes; p++) {
    const next = cur.slice()
    for (let t = 0; t < cur.length; t++) {
      const counts = new Map()
      for (const n of adjacency[t]) counts.set(cur[n], (counts.get(cur[n]) ?? 0) + 1)
      let best = null
      let bc = 0
      for (const [l, c] of counts) if (c > bc) { best = l; bc = c }
      if (best !== null && bc >= 2 && best !== cur[t]) next[t] = best
    }
    cur = next
  }
  return cur
}

export function pickClips(available, keep) {
  const missing = keep.filter((k) => !available.includes(k))
  if (missing.length) throw new Error(`missing clips: ${missing.join(', ')}; available: ${available.join(', ')}`)
  return keep.slice()
}

function need(rel) {
  const p = join(SRC_ROOT, rel)
  if (!existsSync(p)) {
    console.error(`missing source file: ${p}`)
    process.exit(1)
  }
  return p
}

async function main() {
  const bodyPath = need(SRC_BODY)
  const animPath = need(SRC_ANIMS)
  const binPath = bodyPath.replace(/\.gltf$/, '.bin')
  if (!existsSync(binPath)) {
    console.error(`missing source file: ${binPath}`)
    process.exit(1)
  }
  await MeshoptEncoder.ready
  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

  const json = stripTextures(JSON.parse(readFileSync(bodyPath, 'utf8')))
  const binName = json.buffers[0].uri
  const doc = await io.readJSON({ json, resources: { [binName]: new Uint8Array(readFileSync(binPath)) } })
  const ual = await io.read(animPath)
  const root = doc.getRoot()

  const mats = {}
  for (const [n, c] of Object.entries(COL)) {
    mats[n] = doc.createMaterial(n).setBaseColorFactor([...srgb(c), 1]).setRoughnessFactor(1).setMetallicFactor(0)
  }
  mats.Jersey.setBaseColorFactor([Math.pow(0.8, 2.2), 0, Math.pow(0.2, 2.2), 1]) // #CC0033

  const skin = root.listSkins()[0]
  const jn = skin.listJoints().map((j) => j.getName())
  const buf = root.listBuffers()[0]

  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const old = prim.getMaterial()?.getName()
      if (old === 'MI_Hair_1') { prim.setMaterial(mats.Hair); continue }
      if (old === 'MI_Eyes') { prim.setMaterial(mats.Eyes); continue }
      const pos = prim.getAttribute('POSITION')
      const J = prim.getAttribute('JOINTS_0')
      const W = prim.getAttribute('WEIGHTS_0')
      const ia = prim.getIndices().getArray()
      const n = pos.getCount()
      let minY = Infinity
      let maxY = -Infinity
      const p = [0, 0, 0]
      const P = []
      for (let i = 0; i < n; i++) {
        pos.getElement(i, p)
        P.push([p[0], p[1], p[2]])
        minY = Math.min(minY, p[1])
        maxY = Math.max(maxY, p[1])
      }
      const H = maxY - minY
      const j = [0, 0, 0, 0]
      const w = [0, 0, 0, 0]
      const nt = ia.length / 3
      let labels = new Array(nt)
      for (let t = 0; t < nt; t++) {
        const v = [ia[t * 3], ia[t * 3 + 1], ia[t * 3 + 2]]
        const cy = (P[v[0]][1] + P[v[1]][1] + P[v[2]][1]) / 3
        const cx = (P[v[0]][0] + P[v[1]][0] + P[v[2]][0]) / 3
        const wsum = new Map()
        for (const vi of v) {
          J.getElement(vi, j)
          W.getElement(vi, w)
          for (let k = 0; k < 4; k++) wsum.set(j[k], (wsum.get(j[k]) ?? 0) + w[k])
        }
        let bj = 0
        let bw = -1
        for (const [ji, wv] of wsum) if (wv > bw) { bj = ji; bw = wv }
        labels[t] = classifyTriangle({ rel: (cy - minY) / H, xAbsRel: Math.abs(cx) / H, joint: jn[bj] })
      }
      // edge adjacency by quantised position so UV/normal seams don't break neighbours
      const vk = P.map((q) => q.map((x) => Math.round(x * 1e4)).join(','))
      const edges = new Map()
      const adj = Array.from({ length: nt }, () => [])
      for (let t = 0; t < nt; t++) {
        for (let e = 0; e < 3; e++) {
          const a = vk[ia[t * 3 + e]]
          const b = vk[ia[t * 3 + ((e + 1) % 3)]]
          const ek = a < b ? `${a}|${b}` : `${b}|${a}`
          const list = edges.get(ek)
          if (list) list.push(t)
          else edges.set(ek, [t])
        }
      }
      for (const list of edges.values()) {
        for (const a of list) for (const b of list) if (a !== b && !adj[a].includes(b)) adj[a].push(b)
      }
      labels = smoothLabels(labels, adj, 2)
      const groups = { Skin: [], Jersey: [], Shorts: [] }
      for (let t = 0; t < nt; t++) groups[labels[t]].push(ia[t * 3], ia[t * 3 + 1], ia[t * 3 + 2])
      console.log('body split tris:', Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length / 3])))
      for (const [k, v] of Object.entries(groups)) {
        if (!v.length) continue
        const np = doc.createPrimitive().setMaterial(mats[k]).setMode(prim.getMode())
          .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(v)).setBuffer(buf))
        for (const s of prim.listSemantics()) np.setAttribute(s, prim.getAttribute(s))
        mesh.addPrimitive(np)
      }
      mesh.removePrimitive(prim)
    }
  }
  for (const m of root.listMaterials()) if (!mats[m.getName()]) m.dispose()

  // animations from UAL, by joint name
  const byName = new Map(root.listNodes().map((n) => [n.getName(), n]))
  const ualAnims = ual.getRoot().listAnimations()
  const wanted = pickClips(ualAnims.map((a) => a.getName()), KEEP_CLIPS)
  for (const a of ualAnims) {
    if (!wanted.includes(a.getName())) continue
    const na = doc.createAnimation(a.getName())
    for (const ch of a.listChannels()) {
      const path = ch.getTargetPath()
      const tn = ch.getTargetNode()?.getName()
      const tgt = byName.get(tn)
      if (!tgt || path === 'scale') continue
      if (path === 'translation' && !['root', 'pelvis'].includes(tn)) continue
      const s = ch.getSampler()
      const mk = (acc) => doc.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buf)
      const ns = doc.createAnimationSampler().setInput(mk(s.getInput())).setOutput(mk(s.getOutput())).setInterpolation(s.getInterpolation())
      na.addSampler(ns).addChannel(doc.createAnimationChannel().setTargetNode(tgt).setTargetPath(path).setSampler(ns))
    }
  }

  // the source exports one identical Skin per mesh; share a single skin
  for (const node of root.listNodes()) if (node.getSkin() && node.getSkin() !== skin) node.setSkin(skin)
  for (const s of root.listSkins()) if (s !== skin) s.dispose()

  try {
    await doc.transform(joinPrims())
  } catch (e) {
    console.log('join() skipped:', e.message)
  }
  await doc.transform(prune(), dedup(), weld(), resample({ tolerance: 1e-4 }), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizationVolume: 'scene' }))
  doc.createExtension(EXTMeshoptCompression).setRequired(true)
  mkdirSync(dirname(OUT), { recursive: true })
  await io.write(OUT, doc)

  const size = statSync(OUT).size
  const gz = gzipSync(readFileSync(OUT)).length
  let tris = 0
  let prims = 0
  for (const m of doc.getRoot().listMeshes()) for (const pr of m.listPrimitives()) { prims++; tris += pr.getIndices().getCount() / 3 }
  console.log(`wrote ${basename(OUT)}: ${(size / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzip, ${tris} tris, ${prims} primitives`)
  console.log('clips:', doc.getRoot().listAnimations().map((a) => a.getName()).join(', '))
  if (size > MAX_BYTES) {
    console.error(`FAIL: ${size} bytes exceeds ${MAX_BYTES}`)
    process.exit(1)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
