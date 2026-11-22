import { describe, it, expect } from 'vitest';
import { labelVisible } from '../../src/arena/logic/labels';

const cam = { x: -6, z: 0, heading: 0 };
describe('labelVisible', () => {
  it('visible when near player and ahead of camera', () => expect(labelVisible({ x: 0, z: 0 }, cam, [5, 0])).toBe(true));
  it('hidden when too far from player', () => expect(labelVisible({ x: 0, z: 0 }, cam, [8, 0])).toBe(false));
  it('hidden when less than 5 m ahead of camera', () => expect(labelVisible({ x: 0, z: 0 }, cam, [-2, 0])).toBe(false));
  it('hidden when behind camera', () => expect(labelVisible({ x: 0, z: 0 }, cam, [-9, 0])).toBe(false));
  it('uses camera heading', () => expect(labelVisible({ x: 0, z: 0 }, { x: 0, z: -6, heading: Math.PI / 2 }, [0, 3])).toBe(true));
});
