import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { SPEC, sceneGeometry } from '../../../src/world/interiors/civic-center/geometry';
import { SIGNS, SIGN_SPECS } from '../../../src/world/interiors/civic-center/look';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';

describe('civic center', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('civic-center'))).toEqual([]);
  });
  it('places exactly its exhibits at their content positions', () => {
    expect(sceneGeometry('civic-center').exhibits).toEqual(placedIn('civic-center'));
    expect(placedIn('civic-center')).toHaveLength(6);
  });
  it('camera', () => {
    const g = sceneGeometry('civic-center');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(SPEC.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(SPEC.cameraDistance).toBeLessThanOrEqual(18);
    expect(SPEC.cameraSouthPad!).toBeGreaterThanOrEqual(0.5);
    expect(SPEC.cameraSouthPad!).toBeLessThanOrEqual(2);
    expect([SPEC.width, SPEC.length]).toEqual([22, 16]);
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('3D text is only the signs', () => {
    expect(SIGN_SPECS.map((s) => s.text).sort()).toEqual([...SIGNS].sort());
  });
  it('tour desk serves two exhibits', () => {
    const g = sceneGeometry('civic-center');
    const desk = g.colliders.filter((c) => c.z === -7.6 && c.x - c.w / 2 === -6.5 && c.x + c.w / 2 === -1.5);
    expect(desk).toHaveLength(1);
    expect(desk[0].d).toBeLessThanOrEqual(1.2);
    const ids = g.exhibits.map((e) => e.id);
    expect(ids).toContain('honors-ambassador');
    expect(ids).toContain('orientation-leader');
    expect(interiorProblems(g)).toEqual([]);
  });
});
