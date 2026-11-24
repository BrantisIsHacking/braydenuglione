import { describe, expect, it } from 'vitest';
import { artists } from '../../../src/content/artists';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { collectionKeys } from '../../../src/content/collections';
import { exhibitsIn } from '../../../src/content/exhibits';
import { sceneGeometry, STOPS } from '../../../src/world/interiors/record-store/geometry';
import {
  buildBatches, sleeveDesign, SIGN_SPECS, SIGNS, SPEC, stackSlots, TEXT_LINES, TEXT_OBJECTS,
} from '../../../src/world/interiors/record-store/look';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems } from '../../../src/world/logic/interior';
import { uncovered } from '../../../src/world/logic/stops';
import { TEXT_CAP } from '../../../src/world/logic/text';

describe('record store interior', () => {
  it('geometry is valid with every stop', () => {
    expect(interiorProblems(sceneGeometry('record-store'))).toEqual([]);
  });
  it('places the content stations and one stop per artist', () => {
    const g = sceneGeometry('record-store');
    const content = exhibitsIn('record-store');
    expect(g.exhibits).toHaveLength(content.length + artists.length);
    for (const p of content) expect(g.exhibits.find((e) => e.id === p.exhibit.id && e.focus === undefined)!.pos).toEqual(p.pos);
    expect(STOPS).toHaveLength(46);
    expect(STOPS.every((s) => s.id === 'music')).toBe(true);
  });
  it('every artist is reachable from 3D exactly once, in rank order', () => {
    expect(STOPS.map((s) => s.focus)).toEqual(artists);
    expect(uncovered('artists', STOPS.map((s) => s.focus))).toEqual([]);
    expect(collectionKeys('artists')).toHaveLength(46);
  });
  it('stacks: rank order, eight a row, rows run north, offset alternate rows', () => {
    const s = stackSlots();
    expect(s[0].rank).toBe(1);
    expect(s[8].artist).toBe('Tyler, The Creator');
    expect(s[8].row).toBe(1);
    expect(s[45].rank).toBe(46);
    expect(s[0].pos[0]).not.toBe(s[8].pos[0]);
    for (let i = 8; i < 46; i++) expect(s[i].pos[1]).toBeLessThan(s[i - 8].pos[1]);
  });
  it('sleeves are original colour blocks: disc never matches its background, designs vary', () => {
    const d = Array.from({ length: 46 }, (_, i) => sleeveDesign(i));
    for (const x of d) expect(x.disc).not.toBe(x.bg);
    expect(new Set(d.map((x) => JSON.stringify(x))).size).toBeGreaterThan(15);
  });
  it('camera', () => {
    const g = sceneGeometry('record-store');
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBeGreaterThanOrEqual(0.5);
    expect(g.cameraSouthPad).toBeLessThanOrEqual(2);
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
  });
  it('signs are allow-listed and font-safe', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('3D text stays under the cap and carries no artist names', () => {
    expect(TEXT_LINES).toEqual([]);
    expect(TEXT_OBJECTS).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('instances the stacks into few batches', () => {
    const b = buildBatches();
    expect(b.length).toBeLessThanOrEqual(40);
    expect(b.find((x) => x.key === 'box:hardwood:0')!.items.length).toBeGreaterThanOrEqual(46);
  });
});
