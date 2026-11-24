import { describe, expect, it } from 'vitest';
import { playerFrame } from '../../src/world/scene/Player';
import { sceneGeometry } from '../../src/world/interiors/generic/geometry';
import { createDoorLatch } from '../../src/world/logic/doors';
import { worldColliders, worldDoors, MAP } from '../../src/world/logic/layout';
import { NO_INPUT } from '../../src/world/logic/movement';
import { NORTH, SOUTH, type Pose, type SceneGeometry } from '../../src/world/types';

const N = { x: 0, y: 1 }, S = { x: 0, y: -1 };
const DT = 1 / 60;

function run(start: Pose, input: { x: number; y: number }, geo: SceneGeometry, seconds: number) {
  let pose = start;
  const frames: ReturnType<typeof playerFrame>[] = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    const f = playerFrame(pose, input, DT, geo);
    pose = f.pose;
    frames.push(f);
  }
  return frames;
}

const hall = sceneGeometry('library');
const world = (): SceneGeometry => ({
  bounds: MAP, colliders: worldColliders(), doors: worldDoors(), exits: [], exhibits: [],
  entrance: { x: 0, z: 0, heading: NORTH }, cameraDistance: 18,
});

describe('playerFrame', () => {
  it('walking north from the entrance reaches the first exhibit prompt', () => {
    const geo = sceneGeometry('hall-of-fame');
    const frames = run(geo.entrance, N, geo, 0.5); // straight up the centre line: slots at x = ±2 are within the 2.4 m interior reach
    expect(frames[0].nearId).toBeNull();
    expect(frames[frames.length - 1].nearId).not.toBeNull();
  });
  it('exit fires exactly once through the latch', () => {
    const latch = createDoorLatch();
    let fired = 0;
    for (const f of run(hall.entrance, S, hall, 1)) if (latch.update(f.exit ? 'exit' : null)) fired++;
    expect(fired).toBe(1);
  });
  it('detects the gym door walking north at (20, -5)', () => {
    const frames = run({ x: 20, z: -4.5, heading: NORTH }, N, world(), 1);
    expect(frames.some((f) => f.door === 'gym')).toBe(true);
  });
  it('limits labels to 6', () => {
    expect(run(hall.entrance, NO_INPUT, hall, 0.1)[0].labels.length).toBeLessThanOrEqual(6);
  });
  it('prefetches gym near its door and nothing far away', () => {
    const near = playerFrame({ x: 20, z: 0, heading: SOUTH }, NO_INPUT, DT, world());
    expect(near.prefetch).toContain('gym');
    const far = playerFrame({ x: 0, z: 0, heading: NORTH }, NO_INPUT, DT, world());
    expect(far.prefetch).not.toContain('gym');
  });
});

describe('pads', () => {
  const PAD = { id: 'elevator', rect: { x: -5.5, z: -9.6, w: 2, d: 2 }, arrival: { x: -5.5, z: -7.6, heading: SOUTH } };
  const geo: SceneGeometry = { ...sceneGeometry('library'), bounds: { minX: -8, maxX: 8, minZ: -12, maxZ: 0 }, pads: [PAD], colliders: [], exits: [] };
  const bare: SceneGeometry = { ...geo, pads: undefined };
  it('reports the pad under the player', () => {
    expect(playerFrame({ x: -5.5, z: -9.6, heading: NORTH }, NO_INPUT, DT, geo).pad).toBe('elevator');
    expect(playerFrame({ x: -5.5, z: -7.6, heading: SOUTH }, NO_INPUT, DT, geo).pad).toBeNull();
    expect(playerFrame({ x: -5.5, z: -9.6, heading: NORTH }, NO_INPUT, DT, bare).pad).toBeNull();
  });
  it('the latch fires once on stepping onto the pad and not when spawning inside it', () => {
    const latch = createDoorLatch();
    let fired = 0;
    for (const f of run(PAD.arrival, N, geo, 1.5)) if (latch.update(f.pad)) fired++;
    expect(fired).toBe(1);
    const inside = createDoorLatch();
    fired = 0;
    for (const f of run({ x: -5.5, z: -9.6, heading: NORTH }, NO_INPUT, geo, 0.5)) if (inside.update(f.pad)) fired++;
    expect(fired).toBe(0);
    for (const f of run({ x: -5.5, z: -9.6, heading: NORTH }, S, geo, 1)) inside.update(f.pad);
    for (const f of run({ x: -5.5, z: -7.6, heading: NORTH }, N, geo, 1)) if (inside.update(f.pad)) fired++;
    expect(fired).toBe(1);
  });
});
