import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
// @ts-expect-error untyped mjs
import { PHONE_RE, glbJson } from '../../scripts/check-dist.mjs'
import { loadPrivateTerms, findPrivateTerm } from '../../src/privacy/privateTerms.mjs'
import { PLAYER_GLB_MAX_BYTES, KEEP_CLIPS, BONE_HEAD, BONE_CHEST, BONE_FOOT_L, BONE_FOOT_R } from '../../src/world/scene/avatar/avatarConfig'

const path = resolve(__dirname, '../../public/models/player.glb')

describe('player.glb', async () => {
  await MeshoptDecoder.ready
  const buf = readFileSync(path)
  const json = JSON.parse(glbJson(buf) as string)
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).readBinary(new Uint8Array(buf))
  const root = doc.getRoot()

  it('fits the size budget', () => expect(statSync(path).size).toBeLessThanOrEqual(PLAYER_GLB_MAX_BYTES))
  it('has all kept clips', () => {
    const names = root.listAnimations().map((a) => a.getName())
    for (const c of KEEP_CLIPS) expect(names).toContain(c)
  })
  it('uses meshopt only', () => {
    expect(json.extensionsUsed).toContain('EXT_meshopt_compression')
    expect(json.extensionsUsed).not.toContain('KHR_draco_mesh_compression')
    expect(json.extensionsUsed).not.toContain('KHR_texture_basisu')
  })
  it('is self-contained and untextured', () => {
    expect(json.images ?? []).toHaveLength(0)
    expect(json.textures ?? []).toHaveLength(0)
    for (const b of json.buffers ?? []) expect(b.uri).toBeUndefined()
  })
  it('has one skin and the named materials', () => {
    expect(root.listSkins()).toHaveLength(1)
    expect(new Set(root.listMaterials().map((m) => m.getName()))).toEqual(new Set(['Skin', 'Jersey', 'Shorts', 'Hair', 'Eyes']))
  })
  it('has the gear bones', () => {
    const names = new Set(root.listNodes().map((n) => n.getName()))
    for (const n of [BONE_HEAD, BONE_CHEST, BONE_FOOT_L, BONE_FOOT_R]) expect(names.has(n)).toBe(true)
  })
  it('has no phone number or private term', () => {
    const text = glbJson(buf) as string
    expect(PHONE_RE.test(text)).toBe(false)
    expect(findPrivateTerm(text, loadPrivateTerms())).toBeFalsy()
  })
})
