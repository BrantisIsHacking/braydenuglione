import { describe, it, expect } from 'vitest'
// @ts-expect-error untyped mjs
import { KEEP_CLIPS, stripTextures, classifyTriangle, smoothLabels, pickClips } from '../scripts/build-models.mjs'
import { KEEP_CLIPS as CFG_CLIPS } from '../src/world/scene/avatar/avatarConfig'

describe('build-models', () => {
  it('pickClips keeps requested names', () => {
    expect(pickClips(['Idle_Loop', 'X'], ['Idle_Loop'])).toEqual(['Idle_Loop'])
  })
  it('pickClips throws listing available when one is missing', () => {
    expect(() => pickClips(['Idle_Loop', 'X'], ['Idle_Loop', 'Nope'])).toThrow(/X/)
  })
  it('KEEP_CLIPS matches avatarConfig', () => {
    expect(KEEP_CLIPS).toEqual([...CFG_CLIPS])
  })
  it('stripTextures removes images/textures/samplers and refs', () => {
    const json = {
      images: [{ uri: 'a.png' }],
      textures: [{ source: 0 }],
      samplers: [{}],
      materials: [
        { name: 'm', normalTexture: { index: 0 }, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, roughnessFactor: 1 } },
      ],
    }
    const out = stripTextures(json)
    expect(out.images).toBeUndefined()
    expect(out.textures).toBeUndefined()
    expect(out.samplers).toBeUndefined()
    expect(out.materials[0].normalTexture).toBeUndefined()
    expect(out.materials[0].pbrMetallicRoughness.baseColorTexture).toBeUndefined()
    expect(out.materials[0].pbrMetallicRoughness.roughnessFactor).toBe(1)
  })
  it('classifyTriangle follows the region rules', () => {
    expect(classifyTriangle({ rel: 0.6, xAbsRel: 0.05, joint: 'spine_02' })).toBe('Jersey')
    expect(classifyTriangle({ rel: 0.45, xAbsRel: 0.05, joint: 'pelvis' })).toBe('Shorts')
    expect(classifyTriangle({ rel: 0.6, xAbsRel: 0.05, joint: 'upperarm_l' })).toBe('Skin')
    expect(classifyTriangle({ rel: 0.2, xAbsRel: 0.05, joint: 'calf_l' })).toBe('Skin')
  })
  it('smoothLabels flips a lone triangle but keeps a boundary triangle', () => {
    const labels = ['Jersey', 'Skin', 'Skin', 'Skin']
    expect(smoothLabels(labels, [[1, 2, 3], [0], [0], [0]], 1)[0]).toBe('Skin')
    const b = ['Jersey', 'Skin', 'Shorts', 'Hair']
    expect(smoothLabels(b, [[1, 2, 3], [0], [0], [0]], 1)[0]).toBe('Jersey')
  })
})
