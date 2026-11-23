import { describe, expect, it } from 'vitest';
import { buildings, SIGN_ALLOW_LIST } from '../../src/content/buildings';
import { isFontSafe } from '../../src/world/logic/fontSafe';
import { E2E_LANES, LOTS, doorTrigger, worldColliders, worldDoors } from '../../src/world/logic/layout';
import { lampPositions, propBlocked, sceneGeometry, treePositions } from '../../src/world/world/geometry';
import { massingFor } from '../../src/world/world/massing';
import { worldSigns } from '../../src/world/world/signs';

describe('world scene data', () => {
  it('geometry has 14 doors and 3 spot exhibits', () => {
    const g = sceneGeometry();
    expect(g.doors).toHaveLength(14);
    expect(g.exits).toEqual([]);
    expect(g.exhibits).toEqual([
      { id: 'contact', pos: [3, 6] }, { id: 'chess', pos: [22, 4] }, { id: 'roundnet', pos: [36, 4] },
    ]);
  });
  it('signs: 18, font safe, allow-listed', () => {
    const s = worldSigns();
    expect(s).toHaveLength(18);
    for (const x of s) { expect(isFontSafe(x.text)).toBe(true); expect(SIGN_ALLOW_LIST).toContain(x.text); }
  });
  it('massing sits inside lots', () => {
    let total = 0;
    for (const b of buildings) {
      const r = LOTS[b.id].rect;
      const boxes = massingFor(b.id);
      total += boxes.length;
      for (const m of boxes) {
        expect(m.h).toBeGreaterThan(0);
        expect(m.x - m.w / 2).toBeGreaterThanOrEqual(r.x - r.w / 2 - 0.01);
        expect(m.x + m.w / 2).toBeLessThanOrEqual(r.x + r.w / 2 + 0.01);
        expect(m.z - m.d / 2).toBeGreaterThanOrEqual(r.z - r.d / 2 - 0.01);
        expect(m.z + m.d / 2).toBeLessThanOrEqual(r.z + r.d / 2 + 0.01);
      }
    }
    expect(total).toBeLessThanOrEqual(18 * 4);
    expect(massingFor('hq-tower')[0].h).toBe(14);
  });
  it('trees and lamps are clear of colliders, doors and lanes', () => {
    const trees = treePositions(), lamps = lampPositions();
    expect(trees.length).toBeGreaterThanOrEqual(36);
    expect(lamps.length).toBeGreaterThanOrEqual(14);
    const rects = [...worldColliders(), ...worldDoors().map((d) => d.rect), ...E2E_LANES, ...Object.values(LOTS).map(doorTrigger)];
    for (const [x, z] of [...trees, ...lamps]) {
      expect(propBlocked(x, z, 0.6)).toBe(false);
      for (const c of rects) {
        const dx = Math.max(Math.abs(x - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(z - c.z) - c.d / 2, 0);
        expect(dx * dx + dz * dz).toBeGreaterThanOrEqual(0.36);
      }
    }
  });
});
