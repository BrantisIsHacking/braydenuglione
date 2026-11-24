import { describe, expect, it } from 'vitest';
import { buildings } from '../../src/content/buildings';
import type { ThemeColorKey } from '../../src/content/types';
import { DECOR_COLLIDERS, E2E_LANES, LOTS, doorTrigger, exitPose, spotPose } from '../../src/world/logic/layout';
import type { Rect } from '../../src/world/types';
import { EXTERIOR_ACCENTS, SIGN_STYLE, STYLED_IDS, exteriorBulbs, exteriorParts, triCount, type ExteriorPart } from '../../src/world/world/exteriors';
import { massingFor } from '../../src/world/world/massing';
import { worldSigns } from '../../src/world/world/signs';
import { spotParts } from '../../src/world/world/spots';

const NEUTRAL: ThemeColorKey[] = ['offWhite', 'ink', 'stone', 'slate', 'path', 'sky', 'water', 'grass'];
const foot = (p: ExteriorPart): Rect => ({ x: p.x, z: p.z, w: p.sx, d: p.sz });
const hit = (a: Rect, b: Rect, eps = 1e-6) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 - eps && Math.abs(a.z - b.z) < (a.d + b.d) / 2 - eps;
const circleHits = (x: number, z: number, r: number, c: Rect) => {
  const dx = Math.max(Math.abs(x - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(z - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < r * r;
};
const bottom = (p: ExteriorPart) => p.y - p.sy / 2;
const thin = (p: ExteriorPart) => p.sy <= 0.06 || p.sx * p.sz <= 0.02;

describe('exteriors', () => {
  it('each exterior stays under ~1k tris', () => {
    expect(STYLED_IDS).toHaveLength(7);
    for (const id of STYLED_IDS) expect(triCount(exteriorParts(id)) + 12 * massingFor(id).length).toBeLessThanOrEqual(1000);
  });

  it('accents', () => {
    for (const id of STYLED_IDS) {
      expect(EXTERIOR_ACCENTS[id].length).toBeLessThanOrEqual(2);
      const ok = new Set<ThemeColorKey>([...EXTERIOR_ACCENTS[id], ...NEUTRAL]);
      for (const p of exteriorParts(id)) expect(ok.has(p.color), `${id}: ${p.color}`).toBe(true);
    }
  });

  it('details never block a door, exit pose, spot or lane', () => {
    for (const id of STYLED_IDS) {
      const lot = LOTS[id];
      const trig = doorTrigger(lot);
      const exit = exitPose(id);
      const others = Object.values(LOTS).filter((l) => l.id !== id).map((l) => l.rect);
      const inLot = { x: lot.rect.x, z: lot.rect.z, w: lot.rect.w + 0.1, d: lot.rect.d + 0.1 };
      for (const p of exteriorParts(id)) {
        const f = foot(p);
        const tag = `${id} ${p.color} ${p.shape} @${p.x.toFixed(1)},${p.z.toFixed(1)}`;
        if (bottom(p) < 2.2) {
          expect(hit(f, trig), `door ${tag}`).toBe(false);
          expect(circleHits(exit.x, exit.z, 0.9, f), `exit ${tag}`).toBe(false);
          for (const lane of E2E_LANES) expect(hit(f, lane), `lane ${tag}`).toBe(false);
          if (!thin(p)) {
            expect(Math.abs(p.x - inLot.x) + p.sx / 2, `lot x ${tag}`).toBeLessThanOrEqual(inLot.w / 2 + 1e-6);
            expect(Math.abs(p.z - inLot.z) + p.sz / 2, `lot z ${tag}`).toBeLessThanOrEqual(inLot.d / 2 + 1e-6);
          }
          for (const o of others) expect(hit(f, o), `other lot ${tag}`).toBe(false);
        } else {
          // canopies and signs: at most 1.5 m past the south face, never past the sides
          expect(p.z + p.sz / 2, `overhang ${tag}`).toBeLessThanOrEqual(lot.rect.z + lot.rect.d / 2 + 1.5);
          expect(Math.abs(p.x - lot.rect.x) + p.sx / 2, `canopy x ${tag}`).toBeLessThanOrEqual(lot.rect.w / 2 + 1e-6);
        }
      }
    }
  });

  it('reference features exist', () => {
    const lib = exteriorParts('library');
    const canopy = lib.filter((p) => p.color === 'offWhite' && bottom(p) >= 2.2 && p.sx >= 0.5 * LOTS.library.rect.w);
    expect(canopy.length).toBeGreaterThanOrEqual(1);
    expect(lib.filter((p) => p.color === 'stone' && p.sy <= 0.2).length).toBeGreaterThanOrEqual(3);
    expect(lib.filter((p) => p.color === 'slate' && p.sy <= 0.1).length).toBeGreaterThanOrEqual(2);
    expect(lib.filter((p) => p.color === 'sky').length).toBeGreaterThanOrEqual(4);

    const cin = exteriorParts('cinema');
    expect(cin.filter((p) => p.color === 'warmGlow' && (p.glow ?? 0) > 0).length).toBeGreaterThanOrEqual(3);
    expect(cin.some((p) => p.color === 'offWhite' && p.sx >= 8)).toBe(true);
    expect(cin.filter((p) => p.sy >= 1.5 && p.sy <= 2 && p.sz <= 0.12 && p.sx <= 1.5).length).toBeGreaterThanOrEqual(4);

    const arc = exteriorParts('arcade');
    expect(arc.filter((p) => p.shape === 'cylinder' && p.color === 'offWhite' && p.sy > 3).length).toBeGreaterThanOrEqual(4);
    expect(arc.some((p) => p.color === 'teal' && p.sx >= 3)).toBe(true);

    const bulbs = exteriorBulbs();
    expect(bulbs.length).toBeGreaterThanOrEqual(24);
    const lots = [LOTS.arcade.rect, LOTS.playhouse.rect];
    for (const b of bulbs) {
      expect(lots.some((r) => Math.abs(b.x - r.x) <= r.w / 2 && b.z >= r.z - r.d / 2 && b.z <= r.z + r.d / 2 + 0.2)).toBe(true);
    }
  });

  it('sign styles', () => {
    expect(SIGN_STYLE.cinema).toEqual({ board: 'offWhite', color: 'cinemaRed' });
    expect(SIGN_STYLE.arcade!.glow).toBeGreaterThan(0);
    expect(worldSigns().map((s) => s.text)).toEqual(buildings.map((b) => b.sign));
    expect(worldSigns().find((s) => s.id === 'running-loop')!.text).toBe('5K loop');
  });

  it('non-styled buildings have no extra parts', () => {
    expect(exteriorParts('gym')).toEqual([]);
  });
});

describe('spots', () => {
  it('chess park: checker top, pieces, benches, hedges', () => {
    const p = spotParts('chess-park');
    const sq = p.filter((x) => x.shape === 'box' && x.sy === 0.02);
    expect(sq.filter((x) => x.color === 'ink')).toHaveLength(32);
    expect(sq.filter((x) => x.color === 'offWhite')).toHaveLength(32);
    expect(p.filter((x) => x.color === 'hardwood').length).toBeGreaterThanOrEqual(2);
    expect(p.filter((x) => (x.shape === 'cylinder' || x.shape === 'cone') && x.sy <= 0.2).length).toBe(16);
    expect(p.filter((x) => x.color === 'fairway').length).toBeGreaterThanOrEqual(3);
  });
  it('park: net, legs, ball, bench', () => {
    const p = spotParts('park');
    expect(p.some((x) => x.color === 'ink' && x.shape === 'cylinder' && x.sx > 0.7)).toBe(true);
    expect(p.filter((x) => x.shape === 'cylinder' && x.color === 'slate' && x.sy <= 0.3)).toHaveLength(5);
    expect(p.some((x) => x.shape === 'sphere' && x.color === 'mustard')).toBe(true);
    expect(p.some((x) => x.color === 'hardwood')).toBe(true);
  });
  it('running loop: marker base, start line and lane dashes', () => {
    const p = spotParts('running-loop');
    expect(p.filter((x) => x.color === 'offWhite' && x.sy === 0.02).length).toBeGreaterThanOrEqual(20);
    expect(p.some((x) => x.color === 'scarlet')).toBe(true);
    expect(p.some((x) => x.color === 'slate')).toBe(true);
  });
  it('spot parts keep the pose and approach clear', () => {
    for (const id of ['chess-park', 'park', 'running-loop'] as const) {
      const pose = spotPose(id);
      for (const x of spotParts(id)) {
        if (thin(x) && x.sy <= 0.06) continue;
        expect(circleHits(pose.x, pose.z, 0.9, foot(x)), `${id} ${x.color} @${x.x.toFixed(1)},${x.z.toFixed(1)}`).toBe(false);
      }
    }
  });
  it('furniture parts are mirrored by DECOR_COLLIDERS', () => {
    const parts = [...spotParts('chess-park'), ...spotParts('park')].filter((x) => x.color === 'hardwood' || (x.color === 'fairway' && x.sy === 0.6));
    for (const x of parts) {
      expect(DECOR_COLLIDERS.some((c) => Math.abs(c.x - x.x) < 0.05 && Math.abs(c.z - x.z) < 0.05)).toBe(true);
    }
  });
});
