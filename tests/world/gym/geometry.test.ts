import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { stations } from '../../../src/content';
import { reachable } from '../../../src/world/logic/layout';
import { triggerAt } from '../../../src/world/logic/doors';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { GYM_BOUNDS, GYM_ENTRANCE, GYM_EXIT, gymToScene, sceneGeometry } from '../../../src/world/interiors/gym/geometry';
import { GYM_BANNERS, SCORER_TEXT } from '../../../src/world/interiors/gym/gymLook';
import { scoreboardLines } from '../../../src/world/interiors/gym/logic/scoreboard';
import { standBlocks } from '../../../src/world/interiors/gym/logic/dressing';

const g = sceneGeometry();

describe('gym transform', () => {
  it('maps local to scene like rotation.y = PI/2', () => {
    expect(gymToScene([12.425, 0])).toEqual([0, -12.425]);
    for (const [x, z] of [[1, 2], [-3, 4], [12.4, -1], [0, 7], [5.5, 5.5]] as [number, number][]) {
      const v = new Vector3(x, 0, z).applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      const [sx, sz] = gymToScene([x, z]);
      expect(sx).toBeCloseTo(v.x, 9);
      expect(sz).toBeCloseTo(v.z, 9);
    }
  });
});

describe('gym geometry', () => {
  it('bounds, exits and camera', () => {
    expect(g.bounds).toEqual(GYM_BOUNDS);
    expect(g.exits).toEqual([GYM_EXIT]);
    expect(g.doors).toEqual([]);
    expect(g.cameraDistance).toBe(25);
    for (const c of g.colliders) expect(c.z + c.d / 2).toBeLessThan(GYM_EXIT.rect.z - GYM_EXIT.rect.d / 2);
  });
  it('entrance clear of the exit and every collider', () => {
    expect(triggerAt(GYM_ENTRANCE, [GYM_EXIT])).toBeNull();
    for (const c of g.colliders) {
      const dx = Math.max(Math.abs(GYM_ENTRANCE.x - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(GYM_ENTRANCE.z - c.z) - c.d / 2, 0);
      expect(Math.hypot(dx, dz)).toBeGreaterThan(0.4);
    }
  });
  it('exhibits placed and everything reachable', () => {
    expect(g.exhibits).toEqual([{ id: 'basketball', pos: [3, 5] }, { id: 'rising-star', pos: [-3, -7] }]);
    const targets = [...g.exhibits.map((e) => ({ x: e.pos[0], z: e.pos[1] })), { x: GYM_EXIT.rect.x, z: GYM_EXIT.rect.z }];
    expect(reachable(GYM_ENTRANCE, targets, g.colliders, g.bounds)).toEqual([true, true, true]);
  });
  it('no stand reaches past scene z 15', () => {
    for (const b of standBlocks()) {
      const [, z] = gymToScene([b.x, b.z]);
      expect(z + b.w / 2).toBeLessThanOrEqual(15 + 1e-9);
    }
  });
});

describe('gym strings', () => {
  it('are font safe and exactly the authored set', () => {
    const all = [...GYM_BANNERS, ...SCORER_TEXT, ...scoreboardLines(stations)];
    for (const s of all) expect(isFontSafe(s), s).toBe(true);
    expect([...GYM_BANNERS]).toEqual(['VARSITY\n2023–24', 'VARSITY\n2024–25', 'RISING STAR\n2023', '112\nCAREER POINTS', '12\nCAREER HIGH']);
    expect([...SCORER_TEXT]).toEqual(['WELCOME', 'HOME OF #29']);
    expect(scoreboardLines(stations).slice(0, 4)).toEqual(['CAREER\n112 PTS / 26 GAMES', '2024–25\n84 PTS / 20 GAMES', '2023–24\n28 PTS / 6 GAMES', 'CAREER HIGH\n12 PTS']);
  });
});
