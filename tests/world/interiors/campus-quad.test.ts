import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { getStation } from '../../../src/content';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { SPEC, sceneGeometry } from '../../../src/world/interiors/campus-quad/geometry';
import * as look from '../../../src/world/interiors/campus-quad/look';
import * as geo from '../../../src/world/interiors/campus-quad/geometry';

describe('campus quad', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('campus-quad'))).toEqual([]);
    expect(SPEC.width).toBe(26);
    expect(SPEC.length).toBe(20);
  });
  it('places exactly its exhibits at their content positions', () => {
    expect(sceneGeometry('campus-quad').exhibits).toEqual(placedIn('campus-quad'));
  });
  it('camera', () => {
    const g = sceneGeometry('campus-quad');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(SPEC.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(SPEC.cameraDistance).toBeLessThanOrEqual(19);
    expect(SPEC.cameraSouthPad!).toBeGreaterThanOrEqual(0.5);
    expect(SPEC.cameraSouthPad!).toBeLessThanOrEqual(2);
  });
  it('signs', () => {
    expect(look.SIGNS).toEqual(['CAMPUS QUAD', 'HONORS HALL', 'SCREENING ROOM', 'HIGH SCHOOL WING', 'ROBOTICS LAB']);
    for (const s of look.SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of look.SIGN_SPECS) expect(look.SIGNS).toContain(s.text);
  });
  it('3D text is only signs and labels', () => {
    expect(look.SIGN_SPECS.length).toBe(5);
  });
  it('robotics uses the team photo, never the logo', () => {
    expect(look.ROBOTICS_PHOTO.src).toBe('/media/robotics/team-photo.webp');
    for (const mod of [look, geo]) for (const v of Object.values(mod)) expect(JSON.stringify(v) ?? '').not.toMatch(/logo/i);
  });
  it('documentary screen uses the critics-choice poster', () => {
    expect(look.SCREEN_MEDIA.src).toBe('/media/critics-choice/poster.webp');
    expect(getStation('critics-choice')!.video!.poster.src).toBe(look.SCREEN_MEDIA.src);
  });
});
