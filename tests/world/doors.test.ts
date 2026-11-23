import { describe, expect, it } from 'vitest';
import { createDoorLatch, PREFETCH_RADIUS, triggerAt, within } from '../../src/world/logic/doors';
import type { Trigger } from '../../src/world/types';

const T: Trigger[] = [
  { id: 'gym', rect: { x: 20, z: -7, w: 2, d: 1 } },
  { id: 'library', rect: { x: -36, z: -8.5, w: 2, d: 1 } },
];
describe('triggerAt', () => {
  it('inside, outside, edges', () => {
    expect(triggerAt({ x: 20, z: -7 }, T)).toBe('gym');
    expect(triggerAt({ x: 0, z: 0 }, T)).toBeNull();
    expect(triggerAt({ x: 19, z: -7 }, T)).toBe('gym');
    expect(triggerAt({ x: 21, z: -7 }, T)).toBeNull();
    expect(triggerAt({ x: 20, z: -7.5 }, T)).toBe('gym');
    expect(triggerAt({ x: 20, z: -6.5 }, T)).toBeNull();
  });
  it('first match wins', () => {
    const o: Trigger[] = [{ id: 'a', rect: { x: 0, z: 0, w: 2, d: 2 } }, { id: 'b', rect: { x: 0, z: 0, w: 2, d: 2 } }];
    expect(triggerAt({ x: 0, z: 0 }, o)).toBe('a');
  });
});
describe('door latch', () => {
  it('fires only on null to id after arming', () => {
    const l = createDoorLatch();
    expect(l.update('gym')).toBeNull();
    expect(l.update(null)).toBeNull();
    expect(l.update('gym')).toBe('gym');
    expect(l.update('gym')).toBeNull();
    expect(l.update(null)).toBeNull();
    expect(l.update('library')).toBe('library');
  });
  it('reset disarms', () => {
    const l = createDoorLatch();
    l.update(null);
    l.reset();
    expect(l.update('gym')).toBeNull();
  });
});
describe('within', () => {
  it('nearest first, excludes beyond radius', () => {
    const ts: Trigger[] = [
      { id: 'far', rect: { x: 11, z: 0, w: 1, d: 1 } },
      { id: 'b', rect: { x: 6, z: 0, w: 1, d: 1 } },
      { id: 'a', rect: { x: 2, z: 0, w: 1, d: 1 } },
    ];
    expect(PREFETCH_RADIUS).toBe(10);
    expect(within({ x: 0, z: 0 }, ts)).toEqual(['a', 'b']);
    expect(within({ x: 0, z: 0 }, ts, 20)).toEqual(['a', 'b', 'far']);
  });
});
