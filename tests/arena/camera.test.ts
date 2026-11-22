import { describe, it, expect } from 'vitest';
import { cameraTarget, smoothing } from '../../src/arena/logic/camera';

describe('camera', () => {
  it('behind and above', () => {
    const c = cameraTarget({ x: 0, z: 0, heading: 0 });
    expect(c.position[0]).toBeCloseTo(-6); expect(c.position[1]).toBeCloseTo(3.8); expect(c.position[2]).toBeCloseTo(0);
    expect(c.lookAt[0]).toBeCloseTo(2); expect(c.lookAt[1]).toBeCloseTo(1.2); expect(c.lookAt[2]).toBeCloseTo(0);
  });
  it('heading pi/2', () => {
    expect(cameraTarget({ x: 0, z: 0, heading: Math.PI / 2 }).position[2]).toBeCloseTo(-6);
  });
  it('smoothing', () => {
    expect(smoothing(0.016, true)).toBe(1);
    const s = smoothing(0.016, false);
    expect(s).toBeGreaterThan(0); expect(s).toBeLessThan(1);
  });
});
