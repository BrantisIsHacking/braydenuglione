import { describe, expect, it } from 'vitest';
import { buildings } from '../../src/content/buildings';
import { exhibitsIn } from '../../src/content/exhibits';
import { sceneGeometry } from '../../src/world/interiors/generic/geometry';
import { reachable } from '../../src/world/logic/layout';
import { spawnPoseFor } from '../../src/world/history';
import { inFront } from '../../src/world/types';

const ids = buildings.filter((b) => b.kind === 'interior' && b.id !== 'gym').map((b) => b.id);

describe('generic hall geometry', () => {
  it.each(ids)('%s: exhibits, exit and reachability', (id) => {
    const g = sceneGeometry(id);
    expect(g.exhibits.map((e) => e.id)).toEqual(exhibitsIn(id).map((p) => p.exhibit.id));
    expect(g.doors).toEqual([]);
    expect(g.exits).toHaveLength(1);
    expect(g.exits[0].rect.z + g.exits[0].rect.d / 2).toBeCloseTo(g.bounds.maxZ, 5);
    expect(g.cameraDistance).toBe(15);
    expect(g.cameraSouthPad).toBe(0.75);
    const targets = [...g.exhibits.map((e) => inFront(e.pos)), { x: g.exits[0].rect.x, z: g.exits[0].rect.z }];
    expect(reachable(g.entrance, targets, g.colliders, g.bounds).every(Boolean)).toBe(true);
  });
  it('HQ Tower shows all 5 on one floor', () => {
    expect(sceneGeometry('hq-tower').exhibits).toHaveLength(5);
  });
  it('Hall of Fame has 8 including the critics-choice mirror', () => {
    const g = sceneGeometry('hall-of-fame');
    expect(g.exhibits).toHaveLength(8);
    expect(g.exhibits.some((e) => e.id === 'critics-choice')).toBe(true);
  });
  it('slot 0 front pose is where a panel spawn lands', () => {
    const g = sceneGeometry('workshop');
    expect(g.exhibits[0].id).toBe('tranquility-base');
    const target = { scene: { kind: 'interior' as const, id: 'workshop' as const }, pose: null, panelId: 'tranquility-base' };
    expect(spawnPoseFor(target, g)).toEqual({ x: -6, z: -2.5, heading: -Math.PI / 2 });
  });
  it('mirrors come last', () => {
    expect(sceneGeometry('hall-of-fame').exhibits.at(-1)?.id).toBe('critics-choice');
    expect(sceneGeometry('workshop').exhibits.at(-1)?.id).toBe('oculogica');
  });
});
