import { describe, it, expect } from 'vitest';
import { standBlocks, crowdLayout, bannerSlots, STAND, BANNER, JUMBOTRON, CROWD_MAX, mulberry32 } from '../../../src/world/interiors/gym/logic/dressing';

type R = { x: number; z: number; w: number; d: number };
const hits = (b: R, x0: number, x1: number, z0: number, z1: number) =>
  b.x + b.w / 2 > x0 && b.x - b.w / 2 < x1 && b.z + b.d / 2 > z0 && b.z - b.d / 2 < z1;

describe('stands', () => {
  it('24 blocks, clear of floor, tunnel gap respected', () => {
    const bs = standBlocks();
    expect(bs).toHaveLength(24);
    for (const b of bs) {
      expect(hits(b, -17, 17, -12, 12)).toBe(false);
      if (b.z > 0 && Math.abs(b.x) < 16) expect(hits(b, STAND.gap[0], STAND.gap[1], 0, 99)).toBe(false);
    }
  });
  it('no stands on the south (local -x) end', () => {
    for (const b of standBlocks()) expect(b.x - b.w / 2).toBeGreaterThanOrEqual(-15);
  });
});

describe('crowd', () => {
  const seats = crowdLayout();
  const totalSeats = standBlocks().reduce(
    (n, b) => n + Math.floor((b.w > b.d ? b.w : b.d) / STAND.seatGap + 1e-9),
    0,
  );
  it('deterministic, seed-sensitive', () => {
    expect(crowdLayout()).toEqual(seats);
    expect(crowdLayout(30)).not.toEqual(seats);
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it('count and occupancy', () => {
    expect(CROWD_MAX).toBe(120);
    expect(seats.length).toBeLessThanOrEqual(120);
    expect(seats.length / totalSeats).toBeGreaterThanOrEqual(0.05);
    expect(seats.length / totalSeats).toBeLessThanOrEqual(0.15);
  });
  it('seats off floor, out of tunnel gap, face the court', () => {
    for (const s of seats) {
      expect(Math.abs(s.x) <= 17 && Math.abs(s.z) <= 12).toBe(false);
      expect(s.z > 0 && s.x > STAND.gap[0] && s.x < STAND.gap[1]).toBe(false);
      expect(Math.cos(-s.rotY) * -s.x + Math.sin(-s.rotY) * -s.z).toBeGreaterThan(0);
      expect(s.phase).toBeGreaterThanOrEqual(0);
      expect(s.phase).toBeLessThan(Math.PI * 2);
    }
  });
});

describe('banners and scoreboard', () => {
  it('slots', () => {
    const s = bannerSlots(5);
    expect(s).toHaveLength(5);
    s.forEach((p, i) => {
      expect(p.z).toBeCloseTo(-5.2 + 2.6 * i, 9);
      expect(p.y).toBeCloseTo(8.3, 9);
      expect(p.rotY).toBe(-Math.PI / 2);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(9);
    });
    expect(BANNER.topY).toBeLessThanOrEqual(3.2 + 0.24 * (BANNER.x + 6));
  });
  it('scoreboard clears top row', () => expect(JUMBOTRON.y - JUMBOTRON.h / 2).toBeGreaterThanOrEqual(3.3 + 0.5));
});
