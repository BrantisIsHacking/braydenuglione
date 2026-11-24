import { describe, expect, it } from 'vitest';
import { collectionKeys } from '../../../src/content/collections';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { games } from '../../../src/content/games';
import { getExhibit } from '../../../src/content/exhibits';
import { sceneGeometry, STOPS } from '../../../src/world/interiors/arcade/geometry';
import { CAB, cabinetSlot, CABINET_COLORS, MARQUEE, SIGN_SPECS, SIGNS, SPEC, TEXT_LINES } from '../../../src/world/interiors/arcade/look';
import { captionSize } from '../../../src/world/kit/Caption';
import { isFontSafe, toFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { uncovered } from '../../../src/world/logic/stops';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';

describe('arcade interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('arcade'))).toEqual([]);
  });
  it('places its content exhibits at their positions, then its stops', () => {
    expect(sceneGeometry('arcade').exhibits).toEqual([...placedIn('arcade'), ...STOPS]);
  });
  it('camera', () => {
    const g = sceneGeometry('arcade');
    expect(SPEC.width).toBe(24);
    expect(SPEC.length).toBe(24);
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('3D text is content-derived', () => {
    expect(TEXT_LINES).toEqual(games.map((g) => g.title));
    for (const l of TEXT_LINES) expect(isFontSafe(toFontSafe(l))).toBe(true);
  });
  it('text budget', () => {
    const n = textCount({ signs: SIGN_SPECS.length, lines: TEXT_LINES.length, labelled: placedIn('arcade').length });
    expect(n).toBe(22);
    expect(n).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('stops focus real items', () => {
    const keys = collectionKeys('games');
    for (const s of STOPS) {
      expect(getExhibit(s.id)?.building).toBe('arcade');
      expect(keys).toContain(s.focus);
    }
  });
  it('one cabinet per game in content order', () => {
    expect(games).toHaveLength(18);
    expect(cabinetSlot(0)).toEqual([-7.5, -8]);
    expect(cabinetSlot(1)).toEqual([-4.5, -8]);
    expect(cabinetSlot(17)).toEqual([7.5, -20]);
    expect(cabinetSlot(0)).toEqual(placedIn('arcade').find((p) => p.id === 'rocket-league')!.pos);
    expect(cabinetSlot(1)).toEqual(placedIn('arcade').find((p) => p.id === 'fifa')!.pos);
    expect(STOPS).toHaveLength(16);
    STOPS.forEach((s, k) => expect(s).toEqual({ id: 'games', pos: cabinetSlot(k + 2), focus: games[k + 2].title }));
    expect(CAB.cols).toBe(6);
    expect(CABINET_COLORS).toEqual(['teal', 'brick', 'offWhite', 'ink']);
  });
  it('every game is reachable', () => {
    expect(uncovered('games', STOPS.map((s) => s.focus), ['Rocket League', 'FIFA'])).toEqual([]);
  });
  it('long titles wrap inside the marquee', () => {
    expect(MARQUEE.maxWidth).toBeCloseTo(MARQUEE.w - 0.1);
    expect(MARQUEE.w).toBeLessThan(CAB.pitch);
    expect(captionSize(MARQUEE.size)).toBeGreaterThanOrEqual(0.28);
  });
  it('the Halo cabinet is slot 11', () => {
    expect(games[11].title).toBe('Halo');
    expect(STOPS.find((s) => s.focus === 'Halo')!.pos).toEqual(cabinetSlot(11));
  });
  it('cabinet colliders do not touch the walls', () => {
    const g = sceneGeometry('arcade');
    expect(g.colliders.length).toBe(19);
  });
});
