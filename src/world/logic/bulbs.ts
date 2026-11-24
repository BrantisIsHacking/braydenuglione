const CHASE = [1, 0.6, 0.25] as const;

/** Marquee bulb brightness: a chase of period 3 bulbs stepping every 0.4 s, in [0.25, 1]; `still` (reduced motion / low power) = 1. */
export function bulbLevel(i: number, t: number, still: boolean): number {
  if (still) return 1;
  return CHASE[(((Math.floor(t / 0.4) + i) % 3) + 3) % 3];
}
