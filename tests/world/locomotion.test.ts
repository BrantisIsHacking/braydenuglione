import { describe, expect, it } from 'vitest';
import { locomotion, smoothSpeed } from '../../src/world/logic/locomotion';

describe('locomotion', () => {
  it('idle at 0', () => {
    expect(locomotion(0)).toEqual({ idle: 1, run: 0, timeScale: 1 });
  });
  it('full run at 6', () => {
    const l = locomotion(6);
    expect(l.run).toBe(1);
    expect(l.timeScale).toBeCloseTo(6 / 5.3, 5);
  });
  it('weights sum to 1 and run is monotonic', () => {
    let prev = -1;
    for (let i = 0; i <= 60; i++) {
      const l = locomotion(i / 10);
      expect(l.idle + l.run).toBeCloseTo(1, 10);
      expect(l.run).toBeGreaterThanOrEqual(prev);
      prev = l.run;
    }
  });
  it('NaN and negative are idle', () => {
    expect(locomotion(NaN)).toEqual({ idle: 1, run: 0, timeScale: 1 });
    expect(locomotion(-3)).toEqual({ idle: 1, run: 0, timeScale: 1 });
  });
  it('smoothSpeed', () => {
    const s = smoothSpeed(0, 6, 1 / 60);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(6);
    expect(smoothSpeed(2, NaN, 0.016)).toBe(2);
  });
});
