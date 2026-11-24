import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { floorsOf } from '../../../src/content/floors';
import { isFontSafe, toFontSafe } from '../../../src/world/logic/fontSafe';
import { PLAYER_R } from '../../../src/world/logic/collide';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { reachable } from '../../../src/world/logic/layout';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';
import {
  COURSE_LANE, COURSE_STOPS, FLOOR_SPECS, GOLF_COURSE_PAD, HOLES, sceneGeometry,
} from '../../../src/world/interiors/golf-clubhouse/geometry';
import { interests } from '../../../src/content';
import { floorSigns, scorecardLines, SCORECARD_COLUMNS, SIGN_SPECS, SIGNS, TEXT_LINES } from '../../../src/world/interiors/golf-clubhouse/look';
import { NORTH, type Rect } from '../../../src/world/types';

const hit = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;
const distToRect = (p: { x: number; z: number }, r: Rect) =>
  Math.hypot(Math.max(Math.abs(p.x - r.x) - r.w / 2, 0), Math.max(Math.abs(p.z - r.z) - r.d / 2, 0));

describe('golf clubhouse interior', () => {
  it('geometry is valid on both floors', () => {
    for (const f of [1, 2]) expect(interiorProblems(sceneGeometry('golf-clubhouse', f)), `floor ${f}`).toEqual([]);
  });
  it('places its content exhibits at their positions, then its stops', () => {
    expect(sceneGeometry('golf-clubhouse', 1).exhibits).toEqual(placedIn('golf-clubhouse', 1));
    expect(sceneGeometry('golf-clubhouse', 2).exhibits).toEqual(COURSE_STOPS);
  });
  it('floor argument', () => {
    expect(sceneGeometry('golf-clubhouse', 7).floor).toBe(1);
    expect(sceneGeometry('golf-clubhouse').floor).toBe(1);
    expect(sceneGeometry('golf-clubhouse', 2).exhibits).toEqual(COURSE_STOPS);
    expect(sceneGeometry('golf-clubhouse', 1).pads).toEqual([GOLF_COURSE_PAD]);
    expect(sceneGeometry('golf-clubhouse', 2).pads).toBeUndefined();
    expect(sceneGeometry('golf-clubhouse', 2).entrance).toEqual(GOLF_COURSE_PAD.arrival);
    expect(GOLF_COURSE_PAD).toEqual({ id: 'course', rect: { x: 0, z: -11.4, w: 2.4, d: 1.2 }, arrival: { x: 0, z: -2, heading: NORTH }, to: 2 });
  });
  it('camera', () => {
    for (const f of [1, 2] as const) {
      const s = FLOOR_SPECS[f];
      expect(s.cameraDistance).toBeGreaterThanOrEqual(12);
      expect(s.cameraDistance).toBeLessThanOrEqual(18);
      expect(s.cameraSouthPad).toBeGreaterThanOrEqual(0.5);
      expect(s.cameraSouthPad).toBeLessThanOrEqual(2);
      expect(sceneGeometry('golf-clubhouse', f).cameraDistance).toBe(s.cameraDistance);
    }
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
    for (const f of floorsOf('golf-clubhouse')) expect(SIGN_ALLOW_LIST).toContain(f.sign);
  });
  it('3D text is content-derived', () => {
    expect(TEXT_LINES).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    for (const l of TEXT_LINES) expect(isFontSafe(toFontSafe(l))).toBe(true);
  });
  it('text budget', () => {
    expect(textCount({ signs: floorSigns(1).length, lines: scorecardLines().length, labelled: sceneGeometry('golf-clubhouse', 1).exhibits.length })).toBeLessThanOrEqual(TEXT_CAP);
    expect(textCount({ signs: floorSigns(2).length, lines: TEXT_LINES.length + scorecardLines().length, labelled: COURSE_STOPS.length })).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('nine holes snake through the course', () => {
    expect(HOLES.map((h) => h.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const share = (a: Rect, b: Rect) => {
      const dx = Math.abs(a.x - b.x), dz = Math.abs(a.z - b.z);
      return (Math.abs(dx - a.w) < 1e-9 && dz < 1e-9) || (Math.abs(dz - a.d) < 1e-9 && dx < 1e-9);
    };
    for (const h of HOLES) {
      expect([h.cell.w, h.cell.d]).toEqual([7, 7]);
      if (h.n < 9) expect(share(h.cell, HOLES[h.n].cell), `hole ${h.n} -> ${h.n + 1}`).toBe(true);
    }
    const g = sceneGeometry('golf-clubhouse', 2);
    const pts = HOLES.flatMap((h) => [h.tee, h.cup]);
    for (const [x, z] of pts) {
      expect(x).toBeGreaterThanOrEqual(g.bounds.minX);
      expect(x).toBeLessThanOrEqual(g.bounds.maxX);
      expect(z).toBeGreaterThanOrEqual(g.bounds.minZ);
      expect(z).toBeLessThanOrEqual(g.bounds.maxZ);
      for (const c of g.colliders) expect(distToRect({ x, z }, c)).toBeGreaterThanOrEqual(PLAYER_R);
    }
    expect(reachable(g.entrance, pts.map(([x, z]) => ({ x, z })), g.colliders, g.bounds).every(Boolean)).toBe(true);
    const d = (p: [number, number]) => Math.hypot(p[0] - g.entrance.x, p[1] - g.entrance.z);
    const nearest = HOLES.reduce((a, b) => (d(b.tee) < d(a.tee) ? b : a));
    expect(nearest.n).toBe(1);
  });
  it('the course door is clear', () => {
    const g1 = sceneGeometry('golf-clubhouse', 1);
    const r = GOLF_COURSE_PAD.rect;
    expect(r.x - r.w / 2).toBeGreaterThanOrEqual(g1.bounds.minX);
    expect(r.z - r.d / 2).toBeGreaterThanOrEqual(g1.bounds.minZ);
    for (const f of [1, 2]) {
      const g = sceneGeometry('golf-clubhouse', f);
      for (const c of g.colliders) expect(distToRect({ x: 0, z: -2 }, c), `floor ${f}`).toBeGreaterThanOrEqual(PLAYER_R);
    }
    expect(COURSE_LANE).toEqual({ x: 0, z: -7, w: 2.4, d: 8 });
    for (const c of g1.colliders) expect(hit(c, COURSE_LANE)).toBe(false);
    expect(hit({ x: 0, z: -2, w: 0.01, d: 0.01 }, r)).toBe(false);
  });
  it('scorecard shows no invented numbers', () => {
    expect(SCORECARD_COLUMNS).toBe(9);
    expect(TEXT_LINES).toEqual(HOLES.map((h) => String(h.n)));
  });
  it('scorecard text comes from content', () => {
    const detail = interests.find((i) => i.id === 'golf')!.detail!;
    const lines = scorecardLines();
    expect(lines).toHaveLength(2);
    for (const l of lines) {
      expect(detail).toContain(l);
      expect(isFontSafe(toFontSafe(l))).toBe(true);
    }
    expect(lines[0]).toContain('40 (+5)');
    expect(lines[1]).toContain('108');
  });
});
