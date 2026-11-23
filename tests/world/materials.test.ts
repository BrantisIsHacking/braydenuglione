import { describe, it, expect } from 'vitest';
import { BackSide, MeshToonMaterial, NearestFilter } from 'three';
import { createMaterials, gradientMap, materials, NEON_BASE, type MaterialKey } from '../../src/world/scene/materials';
import { theme } from '../../src/world/look/theme';

const keys: MaterialKey[] = ['floor','court','line','prop','dark','accent','accentHot','neon','net','jersey','shorts','stand','hull','crowd','banner','bannerAlt','screen'];
const toonKeys: MaterialKey[] = ['floor','court','line','prop','dark','stand','jersey','shorts','banner','bannerAlt','crowd','neon','accent','accentHot','screen'];

describe('materials', () => {
  it('has every key', () => {
    for (const k of keys) expect(materials[k]).toBeDefined();
    expect(Object.keys(createMaterials(theme)).sort()).toEqual([...keys].sort());
  });
  it('toon materials share the nearest-filtered gradient map', () => {
    for (const k of toonKeys) {
      const m = materials[k] as MeshToonMaterial;
      expect(m).toBeInstanceOf(MeshToonMaterial);
      expect(m.gradientMap).toBe(gradientMap);
    }
    expect(gradientMap.magFilter).toBe(NearestFilter);
    expect(gradientMap.minFilter).toBe(NearestFilter);
    expect(Array.from(gradientMap.image.data as Uint8Array)).toEqual([70, 160, 255]);
  });
  it('neon materials are untonemapped scarlet glows', () => {
    const exp = { neon: 3.5, accent: 1.225, accentHot: 4.9 };
    for (const k of ['neon', 'accent', 'accentHot'] as const) {
      const m = materials[k] as MeshToonMaterial;
      expect(m.toneMapped).toBe(false);
      expect(m.emissiveIntensity).toBeCloseTo(exp[k], 5);
      expect(m.emissive.getHex()).toBe(0xb0002a);
      expect(NEON_BASE[k]).toBeCloseTo(exp[k], 5);
    }
  });
  it('hull renders back faces', () => {
    expect(materials.hull.side).toBe(BackSide);
  });
});
