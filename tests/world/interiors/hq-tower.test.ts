import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { exhibitsIn } from '../../../src/content';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { FLOOR_SPECS, HQ_ELEVATOR, ELEVATOR_LANES, sceneGeometry } from '../../../src/world/interiors/hq-tower/geometry';
import { SIGNS, floorSigns } from '../../../src/world/interiors/hq-tower/look';

const FLOORS = [1, 2, 3, 4] as const;
const hit = (a: { x: number; z: number; w: number; d: number }, b: typeof a) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;

describe('hq-tower interior', () => {
  it('geometry is valid on every floor', () => {
    for (const f of FLOORS) expect(interiorProblems(sceneGeometry('hq-tower', f)), `floor ${f}`).toEqual([]);
  });
  it('places exactly its exhibits per floor', () => {
    const all: string[] = [];
    for (const f of FLOORS) {
      const g = sceneGeometry('hq-tower', f);
      expect(g.exhibits).toEqual(placedIn('hq-tower', f));
      all.push(...g.exhibits.map((e) => e.id));
    }
    expect(all.sort()).toEqual(exhibitsIn('hq-tower').filter((p) => !p.mirror).map((p) => p.exhibit.id).sort());
  });
  it('floor argument', () => {
    expect(sceneGeometry('hq-tower', 7).floor).toBe(1);
    expect(sceneGeometry('hq-tower').floor).toBe(1);
    expect(sceneGeometry('hq-tower', 3).exhibits.map((e) => e.id)).toEqual(['oculogica', 'ai-camp']);
    expect(sceneGeometry('hq-tower', 2).entrance).toEqual(HQ_ELEVATOR.arrival);
    expect(sceneGeometry('hq-tower', 1).pads).toEqual([HQ_ELEVATOR]);
  });
  it('elevator lane is clear on every floor', () => {
    for (const f of FLOORS) for (const c of sceneGeometry('hq-tower', f).colliders) for (const l of ELEVATOR_LANES) expect(hit(c, l), `floor ${f}`).toBe(false);
  });
  it('camera', () => {
    for (const f of FLOORS) {
      const s = FLOOR_SPECS[f];
      expect(s.cameraDistance).toBeGreaterThanOrEqual(12);
      expect(s.cameraDistance).toBeLessThanOrEqual(18);
      expect(s.cameraSouthPad).toBeGreaterThanOrEqual(0.5);
      expect(s.cameraSouthPad).toBeLessThanOrEqual(2.5);
      expect(sceneGeometry('hq-tower', f).cameraDistance).toBe(s.cameraDistance);
    }
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const f of FLOORS) for (const s of floorSigns(f)) expect(SIGNS).toContain(s.text);
  });
});
