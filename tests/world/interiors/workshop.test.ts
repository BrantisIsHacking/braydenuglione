import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { SPEC, sceneGeometry } from '../../../src/world/interiors/workshop/geometry';
import { CHART_BARS, SIGNS, WORKSHOP_SIGNS } from '../../../src/world/interiors/workshop/look';

describe('workshop interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('workshop'))).toEqual([]);
    expect(SPEC.width).toBe(20);
    expect(SPEC.length).toBe(16);
  });
  it('places exactly its exhibits at their content positions', () => {
    expect(sceneGeometry('workshop').exhibits).toEqual(placedIn('workshop'));
    expect(sceneGeometry().exhibits.map((e) => e.id)).toHaveLength(6);
  });
  it('camera', () => {
    const g = sceneGeometry('workshop');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(g.cameraSouthPad).toBeGreaterThanOrEqual(0.5);
    expect(g.cameraSouthPad).toBeLessThanOrEqual(2);
  });
  it('signs', () => {
    expect(SIGNS).toEqual(['WORKSHOP']);
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of WORKSHOP_SIGNS) expect(SIGNS).toContain(s.text);
  });
  it('3D text is only the signs', () => {
    expect(WORKSHOP_SIGNS.map((s) => s.text)).toEqual(['WORKSHOP']);
  });
  it('bar chart heights keep the 3:1 split', () => {
    expect(CHART_BARS).toEqual([3, 1]);
  });
});
