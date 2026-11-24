import { describe, expect, it } from 'vitest';
import { banners } from '../../../src/content';
import { getBuilding } from '../../../src/content/exhibits';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { sceneGeometry, SPEC } from '../../../src/world/interiors/hall-of-fame/geometry';
import { SIGNS, SIGN_SPECS, bannerLines } from '../../../src/world/interiors/hall-of-fame/look';

describe('hall of fame interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('hall-of-fame'))).toEqual([]);
  });
  it('places exactly its exhibits at their content positions', () => {
    expect(sceneGeometry('hall-of-fame').exhibits).toEqual(placedIn('hall-of-fame'));
  });
  it('camera', () => {
    const g = sceneGeometry('hall-of-fame');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(SPEC.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(SPEC.cameraDistance).toBeLessThanOrEqual(18);
    expect(SPEC.cameraSouthPad!).toBeGreaterThanOrEqual(0.5);
    expect(SPEC.cameraSouthPad!).toBeLessThanOrEqual(2);
    expect([SPEC.width, SPEC.length]).toEqual([20, 16]);
  });
  it('signs', () => {
    expect(SIGNS).toEqual(['HALL OF FAME']);
    expect(getBuilding('hall-of-fame')?.sign).toBe('HALL OF FAME');
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
    expect(SIGN_SPECS[0].position).toEqual([0, 4.2, -15.85]);
    expect(SIGN_SPECS[0].board).toBe('scarlet');
  });
  it('banner cloth text is exactly title and year', () => {
    const lines = bannerLines(banners);
    expect(lines).toHaveLength(7);
    expect(lines[0]).toBe("Critic's Choice Prize\n" + banners[0].year);
    for (const l of lines) expect(isFontSafe(l)).toBe(true);
  });
  it('mirror screen is last and on the east', () => {
    expect(sceneGeometry('hall-of-fame').exhibits.at(-1)).toEqual({ id: 'critics-choice', pos: [7.5, -6] });
  });
});
