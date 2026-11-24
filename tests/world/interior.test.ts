import { describe, expect, it } from 'vitest';
import {
  INTERIOR_ENTRANCE, INTERIOR_EXIT, bespokeGeometry, boardSize, interiorProblems, placedIn, propAnchor, propCollider, type InteriorSpec,
} from '../../src/world/logic/interior';
import { NORTH, SOUTH, type SceneGeometry } from '../../src/world/types';

const spec: InteriorSpec = { width: 12, length: 10, colliders: [propCollider([2, -6], 2, 1)], cameraDistance: 14 };
const fixture = (over: Partial<SceneGeometry> = {}): SceneGeometry => ({
  ...bespokeGeometry('workshop', spec),
  exhibits: [{ id: 'a', pos: [2, -6] }],
  ...over,
});

describe('bespoke interior geometry', () => {
  it('a sound fixture has no problems', () => {
    expect(interiorProblems(fixture())).toEqual([]);
  });
  it('bespokeGeometry derives bounds, exit, entrance and exhibits', () => {
    const g = bespokeGeometry('workshop', spec);
    expect(g.bounds).toEqual({ minX: -6, maxX: 6, minZ: -10, maxZ: 0 });
    expect(g.exits).toEqual([INTERIOR_EXIT]);
    expect(g.doors).toEqual([]);
    expect(g.entrance).toEqual(INTERIOR_ENTRANCE);
    expect(g.exhibits).toEqual(placedIn('workshop'));
    expect(g.exhibits.map((e) => e.id)).toEqual(['tranquility-base', 'dreams-come-true', 'debate-mate', 'zayi-ai-studio', 'airbnb-classifier', 'oculogica']);
    expect('floor' in g).toBe(false);
    expect(bespokeGeometry('hq-tower', spec, 3)).toMatchObject({ floor: 3 });
  });
  it('prop anchors and colliders', () => {
    expect(propAnchor([3, -7])).toEqual([3, -8.6]);
    expect(propCollider([0, 0], 3, 1.6)).toEqual({ x: 0, z: -1.6, w: 3, d: 1.6 });
    expect(() => propCollider([0, 0], 3.1, 1)).toThrow();
    expect(() => propCollider([0, 0], 1, 1.7)).toThrow();
  });
  it('placedIn filters by floor and rejects unplaced content', () => {
    expect(placedIn('hq-tower', 3).map((e) => e.id)).toEqual(['oculogica', 'ai-camp']);
    expect(placedIn('hq-tower')).toHaveLength(5);
    expect(() => placedIn('library')).toThrow('missing pos: books');
  });
  it('names each failure mode', () => {
    const joined = (g: SceneGeometry) => interiorProblems(g).join('\n');
    expect(joined(fixture({ colliders: [{ x: 0, z: -2, w: 2, d: 1 }] }))).toMatch(/entrance/);
    expect(joined(fixture({ exhibits: [{ id: 'a', pos: [2, -6] }, { id: 'b', pos: [4, -6] }] }))).toMatch(/a and b: rings are closer/);
    const wall = [{ x: 0, z: -3.2, w: 12, d: 1 }];
    expect(joined(fixture({ colliders: wall }))).toMatch(/unreachable/);
    const pad = { id: 'p', rect: { x: -3, z: -5, w: 2, d: 2 }, arrival: { x: -3, z: -5, heading: SOUTH } };
    expect(joined(fixture({ pads: [pad] }))).toMatch(/arrival is inside a pad/);
    expect(joined(fixture({ exits: [{ id: 'exit', rect: { x: 0, z: -3, w: 2.4, d: 0.9 } }] }))).toMatch(/south wall/);
    expect(joined(fixture({ colliders: [{ x: 9, z: -3, w: 2, d: 1 }] }))).toMatch(/collider 0 is outside/);
    expect(joined(fixture({ exits: [] }))).toMatch(/exactly one exit/);
  });
  it('stage 2 content positions are inside their rooms', () => {
    for (const id of ['workshop', 'civic-center', 'campus-quad', 'hall-of-fame'] as const) {
      const g = bespokeGeometry(id, { width: 26, length: 20, colliders: [], cameraDistance: 15 });
      expect(g.exhibits.length, id).toBeGreaterThan(5);
    }
    expect(INTERIOR_ENTRANCE.heading).toBe(NORTH);
  });
  it('boardSize keeps the aspect ratio, 16:9 when unknown', () => {
    expect(boardSize({ src: '/media/x.webp', alt: '', width: 1280, height: 720 }, 3)).toEqual([3, 1.6875]);
    expect(boardSize({ src: '/media/x.webp', alt: '' }, 3)).toEqual([3, 1.6875]);
  });
});
