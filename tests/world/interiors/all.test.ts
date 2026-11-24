import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildings, exhibitsIn, floorsOf, SIGN_ALLOW_LIST } from '../../../src/content';
import type { BuildingId } from '../../../src/content/types';
import { books } from '../../../src/content/books';
import { teams } from '../../../src/content/teams';
import { stops as cinemaStops } from '../../../src/world/interiors/cinema/geometry';
import { uncovered } from '../../../src/world/logic/stops';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';
import { interiorLoaders } from '../../../src/world/interiors/registry';
import { interiorProblems } from '../../../src/world/logic/interior';
import { sceneGeometry as campusQuad } from '../../../src/world/interiors/campus-quad/geometry';
import { sceneGeometry as cinema } from '../../../src/world/interiors/cinema/geometry';
import { sceneGeometry as civicCenter } from '../../../src/world/interiors/civic-center/geometry';
import { sceneGeometry as hallOfFame } from '../../../src/world/interiors/hall-of-fame/geometry';
import { sceneGeometry as hq } from '../../../src/world/interiors/hq-tower/geometry';
import { sceneGeometry as workshop } from '../../../src/world/interiors/workshop/geometry';
import { sceneGeometry as library, } from '../../../src/world/interiors/library/geometry';
import { sceneGeometry as arcade, STOPS as arcadeStops } from '../../../src/world/interiors/arcade/geometry';
import { sceneGeometry as recordStore, STOPS as recordStops } from '../../../src/world/interiors/record-store/geometry';
import { sceneGeometry as playhouse } from '../../../src/world/interiors/playhouse/geometry';
import { sceneGeometry as fanShop, STOPS as fanStops } from '../../../src/world/interiors/fan-shop/geometry';
import { sceneGeometry as golf } from '../../../src/world/interiors/golf-clubhouse/geometry';
import { SIGNS as librarySigns, SIGN_SPECS as librarySpecs, TEXT_LINES as libraryLines, unitRanges, shelfLayout } from '../../../src/world/interiors/library/look';
import { SIGNS as arcadeSigns, SIGN_SPECS as arcadeSpecs, TEXT_LINES as arcadeLines } from '../../../src/world/interiors/arcade/look';
import { SIGNS as recordSigns, SIGN_SPECS as recordSpecs, TEXT_LINES as recordLines } from '../../../src/world/interiors/record-store/look';
import { SIGNS as playhouseSigns, SIGN_SPECS as playhouseSpecs, TEXT_LINES as playhouseLines } from '../../../src/world/interiors/playhouse/look';
import { SIGNS as fanSigns, SIGN_SPECS as fanSpecs, TEXT_LINES as fanLines } from '../../../src/world/interiors/fan-shop/look';
import { SIGNS as golfSigns } from '../../../src/world/interiors/golf-clubhouse/look';
import { SIGNS as campusSigns } from '../../../src/world/interiors/campus-quad/look';
import { SIGNS as cinemaSigns } from '../../../src/world/interiors/cinema/look';
import { SIGNS as civicSigns } from '../../../src/world/interiors/civic-center/look';
import { SIGNS as hofSigns } from '../../../src/world/interiors/hall-of-fame/look';
import { SIGNS as hqSigns } from '../../../src/world/interiors/hq-tower/look';
import { SIGNS as workshopSigns } from '../../../src/world/interiors/workshop/look';

const SINGLE: [BuildingId, () => ReturnType<typeof workshop>][] = [
  ['workshop', () => workshop('workshop')],
  ['civic-center', () => civicCenter('civic-center')],
  ['campus-quad', () => campusQuad('campus-quad')],
  ['hall-of-fame', () => hallOfFame('hall-of-fame')],
  ['cinema', () => cinema('cinema')],
];
const STAGE3: [BuildingId, () => ReturnType<typeof workshop>][] = [
  ['library', () => library('library')],
  ['arcade', () => arcade('arcade')],
  ['record-store', () => recordStore('record-store')],
  ['playhouse', () => playhouse('playhouse')],
  ['fan-shop', () => fanShop('fan-shop')],
];
const FLOORS = [1, 2, 3, 4];
const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort();

describe('stage 2 interiors, all together', () => {
  for (const [id, geo] of SINGLE) {
    it(`${id}: valid geometry, every exhibit placed`, () => {
      expect(interiorProblems(geo())).toEqual([]);
      const placed = ids(geo().exhibits);
      const want = exhibitsIn(id).map((p) => p.exhibit.id).sort();
      // the cinema also owns poster stops that are not content placements
      if (id === 'cinema') expect(placed).toEqual(expect.arrayContaining(want));
      else expect(placed).toEqual(want);
    });
  }
  it('hq-tower: every floor valid; floors together place every exhibit once', () => {
    for (const f of FLOORS) expect(interiorProblems(hq('hq-tower', f)), `floor ${f}`).toEqual([]);
    expect(floorsOf('hq-tower').map((f) => f.n)).toEqual(FLOORS);
    const placed = FLOORS.flatMap((f) => hq('hq-tower', f).exhibits.map((e) => e.id)).sort();
    expect(placed).toEqual(exhibitsIn('hq-tower').map((p) => p.exhibit.id).sort());
  });
  for (const [id, geo] of STAGE3) {
    it(`${id}: valid geometry, content exhibits placed (stops allowed)`, () => {
      expect(interiorProblems(geo())).toEqual([]);
      expect(ids(geo().exhibits)).toEqual(expect.arrayContaining(exhibitsIn(id).map((p) => p.exhibit.id)));
    });
  }
  it('golf clubhouse and course floors are valid and place the golf exhibit', () => {
    for (const f of [1, 2]) expect(interiorProblems(golf('golf-clubhouse', f)), `floor ${f}`).toEqual([]);
    expect(ids(golf('golf-clubhouse', 1).exhibits)).toEqual(expect.arrayContaining(exhibitsIn('golf-clubhouse').map((p) => p.exhibit.id)));
  });
  it('stage 3 text stays within the cap', () => {
    const rows: [string, number, number, number][] = [
      ['library', librarySpecs.length, libraryLines.length, exhibitsIn('library').length],
      ['arcade', arcadeSpecs.length, arcadeLines.length, exhibitsIn('arcade').length],
      ['record-store', recordSpecs.length, recordLines.length, exhibitsIn('record-store').length],
      ['playhouse', playhouseSpecs.length, playhouseLines.length, exhibitsIn('playhouse').length],
      ['fan-shop', fanSpecs.length, fanLines.length, exhibitsIn('fan-shop').length],
    ];
    for (const [id, signs, lines, labelled] of rows) expect(textCount({ signs, lines, labelled }), id).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('every collection item is reachable from 3D', () => {
    expect(books).toHaveLength(75);
    expect(shelfLayout()).toHaveLength(75);
    expect(unitRanges()).toHaveLength(3);
    expect(uncovered('games', arcadeStops.map((s) => s.focus), ['Rocket League', 'FIFA'])).toEqual([]);
    expect(uncovered('artists', recordStops.map((s) => s.focus))).toEqual([]);
    expect(uncovered('films', cinemaStops().map((s) => s.focus))).toEqual([]);
    // teams are reached through the Fan Shop's panel placement, music through every artist stop
    expect(exhibitsIn('fan-shop').some((p) => p.exhibit.id === 'teams')).toBe(true);
    expect(fanStops.length).toBeGreaterThan(0);
    expect(teams.length).toBeGreaterThan(0);
  });
  it('every interior sign is on the allow-list', () => {
    for (const s of [...workshopSigns, ...civicSigns, ...campusSigns, ...hofSigns, ...hqSigns, ...cinemaSigns, ...librarySigns, ...arcadeSigns, ...recordSigns, ...playhouseSigns, ...fanSigns, ...golfSigns]) {
      expect(SIGN_ALLOW_LIST, s).toContain(s);
    }
  });
  it('the registry holds exactly the bespoke buildings', () => {
    expect(Object.keys(interiorLoaders).sort()).toEqual(buildings.filter((b) => b.bespoke).map((b) => b.id).sort());
  });
  it('no bespoke interior imports the generic hall', () => {
    for (const id of ['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame', 'cinema', 'library', 'arcade', 'record-store', 'playhouse', 'fan-shop', 'golf-clubhouse', 'gym']) {
      const src = readFileSync(join(__dirname, `../../../src/world/interiors/${id}/Interior.tsx`), 'utf8');
      expect(src, id).not.toContain('../generic/');
    }
  });
});
