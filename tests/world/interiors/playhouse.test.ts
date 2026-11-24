import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { sceneGeometry } from '../../../src/world/interiors/playhouse/geometry';
import { buildBatches, marqueeBulbs, PLAYHOUSE_LOOK, SIGN_SPECS, SIGNS, SPEC, TEXT_LINES, showTitle } from '../../../src/world/interiors/playhouse/look';
import { isFontSafe, toFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';
import { PLAYER_R } from '../../../src/world/logic/collide';
import type { Rect } from '../../../src/world/types';

const hits = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;

describe('playhouse interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('playhouse'))).toEqual([]);
  });
  it('places its content exhibits at their positions', () => {
    expect(sceneGeometry('playhouse').exhibits).toEqual(placedIn('playhouse'));
  });
  it('camera', () => {
    const g = sceneGeometry('playhouse');
    expect(SPEC.width).toBe(18);
    expect(SPEC.length).toBe(20);
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
  });
  it('signs', () => {
    expect(SIGNS).toEqual(['PLAYHOUSE', 'BOX OFFICE']);
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('marquee shows the content title', () => {
    expect(TEXT_LINES).toEqual(['Stranger Things on Broadway']);
    expect(showTitle()).toBe('Stranger Things on Broadway');
    for (const l of TEXT_LINES) expect(isFontSafe(toFontSafe(l))).toBe(true);
  });
  it('text budget', () => {
    expect(textCount({ signs: SIGN_SPECS.length, lines: TEXT_LINES.length, labelled: placedIn('playhouse').length })).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('centre aisle is clear', () => {
    const aisle: Rect = { x: 0, z: -6, w: 2.4, d: 8 };
    expect(SPEC.colliders.some((c) => hits(c, aisle))).toBe(false);
  });
  it('stage is a collider and the room is palette-only', () => {
    expect(SPEC.colliders.some((c) => c.z < -13.5 && c.w >= 18)).toBe(true);
    expect(PLAYHOUSE_LOOK.floor).toBe('cinemaRed');
    expect(PLAYER_R).toBeGreaterThan(0);
  });
  it('instances everything into few batches, bulbs in one', () => {
    expect(buildBatches().length).toBeLessThanOrEqual(20);
    expect(marqueeBulbs().length).toBeGreaterThan(20);
  });
});
