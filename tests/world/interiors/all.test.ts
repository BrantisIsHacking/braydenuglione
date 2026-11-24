import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildings, exhibitsIn, floorsOf, SIGN_ALLOW_LIST } from '../../../src/content';
import type { BuildingId } from '../../../src/content/types';
import { interiorLoaders } from '../../../src/world/interiors/registry';
import { interiorProblems } from '../../../src/world/logic/interior';
import { sceneGeometry as campusQuad } from '../../../src/world/interiors/campus-quad/geometry';
import { sceneGeometry as cinema } from '../../../src/world/interiors/cinema/geometry';
import { sceneGeometry as civicCenter } from '../../../src/world/interiors/civic-center/geometry';
import { sceneGeometry as hallOfFame } from '../../../src/world/interiors/hall-of-fame/geometry';
import { sceneGeometry as hq } from '../../../src/world/interiors/hq-tower/geometry';
import { sceneGeometry as workshop } from '../../../src/world/interiors/workshop/geometry';
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
  it('every interior sign is on the allow-list', () => {
    for (const s of [...workshopSigns, ...civicSigns, ...campusSigns, ...hofSigns, ...hqSigns, ...cinemaSigns]) {
      expect(SIGN_ALLOW_LIST, s).toContain(s);
    }
  });
  it('the registry holds exactly the bespoke buildings', () => {
    expect(Object.keys(interiorLoaders).sort()).toEqual(buildings.filter((b) => b.bespoke).map((b) => b.id).sort());
  });
  it('no bespoke interior imports the generic hall', () => {
    for (const id of ['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame', 'cinema']) {
      const src = readFileSync(join(__dirname, `../../../src/world/interiors/${id}/Interior.tsx`), 'utf8');
      expect(src, id).not.toContain('../generic/');
    }
  });
});
