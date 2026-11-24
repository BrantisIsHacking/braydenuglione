import { describe, expect, it } from 'vitest';
import { books } from '../../../src/content/books';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { collectionKeys } from '../../../src/content/collections';
import { exhibitsIn, getExhibit } from '../../../src/content/exhibits';
import { titleSortKey } from '../../../src/ui/CollectionList';
import { sceneGeometry } from '../../../src/world/interiors/library/geometry';
import {
  favoriteTitles, SHELF, shelfLayout, SIGN_SPECS, SIGNS, SPEC, SPINE, SPINE_COLORS, STOPS, TEXT_LINES, unitRanges, unitStops,
} from '../../../src/world/interiors/library/look';
import { isFontSafe, toFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { uncovered } from '../../../src/world/logic/stops';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';

describe('library interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('library'))).toEqual([]);
  });
  it('places its content exhibits at their positions, then its stops', () => {
    expect(sceneGeometry('library').exhibits).toEqual([...placedIn('library'), ...STOPS]);
  });
  it('camera', () => {
    const g = sceneGeometry('library');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(g.cameraSouthPad).toBeGreaterThanOrEqual(0.5);
    expect(g.cameraSouthPad).toBeLessThanOrEqual(2);
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(toFontSafe(s))).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('3D text is content-derived', () => {
    expect(TEXT_LINES).toEqual([...unitRanges().map((r) => r.label), ...favoriteTitles()]);
    for (const l of TEXT_LINES) expect(isFontSafe(toFontSafe(l))).toBe(true);
  });
  it('text budget', () => {
    const labelled = placedIn('library').length;
    expect(textCount({ signs: SIGN_SPECS.length, lines: TEXT_LINES.length, labelled })).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('stops focus real items', () => {
    const keys = collectionKeys('books');
    for (const s of STOPS) {
      expect(exhibitsIn('library').some((p) => p.exhibit.id === s.id)).toBe(true);
      const ex = getExhibit(s.id);
      expect(ex?.type === 'interest' ? ex.interest.collection : undefined).toBe('books');
      expect(keys).toContain(s.focus);
    }
    expect(STOPS).toHaveLength(3);
  });
  it('unit stops focus the first book of each unit', () => {
    expect(STOPS.map((s) => s.focus)).toEqual(unitRanges().map((r) => r.first));
    expect(STOPS.map((s) => s.pos)).toEqual([[-6.5, -16], [0, -16], [6.5, -16]]);
    for (const r of unitRanges()) expect(r.label).toMatch(/^[A-Z#]–[A-Z#]$/);
    expect(unitStops()).toEqual(STOPS);
  });
  it('every book is on a shelf exactly once', () => {
    expect(shelfLayout().map((s) => s.title).sort()).toEqual(books.map((b) => b.title).sort());
    expect(books).toHaveLength(75);
  });
  it('shelves are alphabetical by unit and fit', () => {
    const lay = shelfLayout();
    const sorted = [...books].sort((a, b) => titleSortKey(a.title).localeCompare(titleSortKey(b.title)) || a.title.localeCompare(b.title));
    const byUnit = [0, 1, 2].map((u) => lay.filter((s) => s.unit === u).map((s) => s.title));
    expect(byUnit.flat()).toEqual(sorted.map((b) => b.title));
    expect(byUnit.map((u) => u.length)).toEqual([25, 25, 25]);
    for (let u = 0; u < 3; u++)
      for (let s = 0; s < SHELF.shelves; s++) {
        const row = lay.filter((x) => x.unit === u && x.shelf === s);
        const used = row.reduce((a, x) => a + x.w, 0) + SPINE.gap * Math.max(0, row.length - 1);
        expect(used).toBeLessThanOrEqual(SHELF.innerW);
        expect(row.length).toBeGreaterThan(0);
        for (const x of row) {
          expect(x.w).toBeGreaterThanOrEqual(0.18);
          expect(x.w).toBeLessThanOrEqual(0.3);
          expect(x.h).toBeGreaterThanOrEqual(0.36);
          expect(x.h).toBeLessThanOrEqual(0.5);
          expect(SPINE_COLORS).toContain(x.color);
        }
      }
    expect(shelfLayout()).toEqual(shelfLayout());
  });
  it('leaves empty shelf space and grows with content only', () => {
    const lay = shelfLayout();
    for (let u = 0; u < 3; u++)
      for (let s = 0; s < SHELF.shelves; s++) {
        const row = lay.filter((x) => x.unit === u && x.shelf === s);
        expect(row.reduce((a, x) => a + x.w + SPINE.gap, 0)).toBeLessThan(SHELF.innerW - 0.3);
      }
    const more = [...books, ...Array.from({ length: 9 }, (_, i) => ({ title: `Zed ${i}`, author: 'A' }))];
    expect(shelfLayout(more)).toHaveLength(84);
    expect(unitRanges(more).map((r) => r.unit)).toEqual([0, 1, 2]);
    const huge = [...books, ...Array.from({ length: 70 }, (_, i) => ({ title: `Extra ${i}`, author: 'A' }))];
    for (const x of shelfLayout(huge)) expect(x.x + x.w / 2).toBeLessThanOrEqual(SHELF.xs[x.unit] + SHELF.innerW / 2);
  });
  it('favorites are the content favorites', () => {
    expect(favoriteTitles()).toEqual(['Pride and Prejudice', 'The Invisible Life of Addie LaRue', 'Feed', '1984']);
  });
  it('every book is reachable', () => {
    // the shelf stops cover each unit's first book; the panel lists every book
    expect(uncovered('books', STOPS.map((s) => s.focus), collectionKeys('books')).length).toBe(0);
  });
});
