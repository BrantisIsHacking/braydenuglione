import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { films } from '../../../src/content/films';
import { exhibitsIn } from '../../../src/content/exhibits';
import { sceneGeometry } from '../../../src/world/interiors/cinema/geometry';
import { buildBatches, POSTER_DESIGNS, posterLines, posterSlots, SIGN_SPECS, SIGNS, SPEC } from '../../../src/world/interiors/cinema/look';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems } from '../../../src/world/logic/interior';

describe('cinema interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('cinema'))).toEqual([]);
  });
  it('places the poster stops and the screen; content positions match', () => {
    const g = sceneGeometry('cinema');
    expect(g.exhibits).toHaveLength(13);
    expect(g.exhibits.slice(0, 12).every((e) => e.id === 'movies')).toBe(true);
    expect(g.exhibits[12].id).toBe('critics-choice');
    const content = exhibitsIn('cinema');
    expect(g.exhibits[0].pos).toEqual(content.find((p) => p.exhibit.id === 'movies')!.pos);
    expect(g.exhibits[12].pos).toEqual(content.find((p) => p.exhibit.id === 'critics-choice')!.pos);
  });
  it('camera', () => {
    const g = sceneGeometry('cinema');
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
  it('posters are the 12 films in owner order, one distinct design each', () => {
    const slots = posterSlots();
    expect(slots.map((p) => p.film.title)).toEqual(films.map((f) => f.title));
    expect(films).toHaveLength(12);
    expect(POSTER_DESIGNS).toHaveLength(12);
    expect(new Set(POSTER_DESIGNS.map((d) => JSON.stringify(d))).size).toBe(12);
    // rows run north, left wall first
    expect(slots.map((p) => p.side)).toEqual([-1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1]);
    for (let i = 2; i < 12; i++) expect(slots[i].zc).toBeLessThanOrEqual(slots[i - 2].zc - 3);
  });
  it('3D text is content-derived', () => {
    expect(posterLines()).toEqual(films.map((f) => `${f.title}\n${f.year}`));
    expect(posterLines()[2]).toBe('Cars\n2006');
  });
  it('instances posters and seats into few batches', () => {
    const b = buildBatches();
    expect(b.length).toBeLessThanOrEqual(40);
    const seats = b.find((x) => x.key === 'box:cinemaRed:0')!;
    expect(seats.items.length).toBeGreaterThanOrEqual(2 * 6 * 9 * 2);
  });
});

describe('cinema poster focus', () => {
  it('each poster stop focuses its film; the screen has no focus', async () => {
    const { sceneGeometry } = await import('../../../src/world/interiors/cinema/geometry');
    const { films } = await import('../../../src/content/films');
    const ex = sceneGeometry('cinema').exhibits;
    expect(ex.slice(0, 12).map((e) => e.focus)).toEqual(films.map((f) => f.title));
    expect(ex[12].focus).toBeUndefined();
  });
});
