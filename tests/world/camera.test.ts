import { describe, it, expect } from 'vitest';
import { cameraOffset, cameraDistance, zoomStep, viewHalfExtents, clampFocus, followFocus, smoothing, portraitPullback, hudShiftPx } from '../../src/world/logic/camera';

const MAP_LIKE = { minX: -48, maxX: 48, minZ: -40, maxZ: 40 };

describe('camera', () => {
  it('offset is south of focus', () => {
    const o = cameraOffset(18);
    expect(o[0]).toBeCloseTo(0, 3); expect(o[1]).toBeCloseTo(14.745, 3); expect(o[2]).toBeCloseTo(10.324, 3);
  });
  it('distance and zoom', () => {
    expect(cameraDistance(18, 1)).toBe(18);
    expect(cameraDistance(12, 0)).toBe(9);
    expect(zoomStep(2, 1)).toBe(2); expect(zoomStep(0, -1)).toBe(0); expect(zoomStep(1, 1)).toBe(2);
  });
  it('view half extents', () => {
    const h = viewHalfExtents(18, 16 / 9);
    expect(h.halfX).toBeCloseTo(11.65, 1); expect(h.halfZ).toBeCloseTo(8.0, 1);
  });
  it('clampFocus', () => {
    expect(clampFocus({ x: -48, z: 0 }, MAP_LIKE, { halfX: 12, halfZ: 8 })).toEqual({ x: -36, z: 0 });
    expect(clampFocus({ x: 5, z: 7 }, { minX: -2, maxX: 2, minZ: 0, maxZ: 4 }, { halfX: 12, halfZ: 8 })).toEqual({ x: 0, z: 2 });
  });
  it('followFocus', () => {
    const prev = { x: 0, z: 0 };
    expect(followFocus(prev, { x: 0.8, z: 0 }, 0.016, false)).toEqual(prev);
    expect(followFocus(prev, { x: 3, z: 0 }, 0.016, true).x).toBeCloseTo(2);
    const f = followFocus(prev, { x: 3, z: 0 }, 1 / 60, false);
    expect(f.x).toBeGreaterThan(0); expect(f.x).toBeLessThan(2);
    expect(followFocus(prev, { x: 3, z: 0 }, NaN, false)).toEqual(prev);
  });
  it('smoothing', () => {
    expect(smoothing(0.016, true)).toBe(1);
    const s = smoothing(0.016, false);
    expect(s).toBeGreaterThan(0); expect(s).toBeLessThan(1);
  });
});

describe('portrait framing', () => {
  it('pulls back only below the portrait aspect, capped', () => {
    expect(portraitPullback(1.6)).toBe(1);
    expect(portraitPullback(0.85)).toBe(1);
    expect(portraitPullback(412 / 839)).toBeGreaterThan(1.2);
    expect(portraitPullback(0.1)).toBeLessThanOrEqual(1.45);
    expect(portraitPullback(0)).toBe(1);
  });
  it('HUD shift is taller in portrait and bounded by the height', () => {
    expect(hudShiftPx(1280, 800, 60)).toBe(60);
    expect(hudShiftPx(412, 839, 60)).toBe(100);
    expect(hudShiftPx(300, 700, 60)).toBe(91);
  });
});
