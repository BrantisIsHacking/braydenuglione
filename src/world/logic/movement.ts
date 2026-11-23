import { PLAYER_R, collide } from './collide';
import type { Bounds, Pose, Rect } from '../types';

export const SPEED = 6, MAX_DT = 0.05, TURN_SPEED = 12; // rad/s
/** Screen-relative: x → east, y → north (−z); length ≤ 1. */
export type MoveInput = { x: number; y: number };
export const NO_INPUT: MoveInput = { x: 0, y: 0 };

const TWO_PI = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function normalise(h: number): number {
  const r = h - TWO_PI * Math.ceil((h - Math.PI) / TWO_PI);
  return r <= -Math.PI ? r + TWO_PI : r;
}

export function step(p: Pose, input: MoveInput, dt: number, geo: { bounds: Bounds; colliders: readonly Rect[] }): Pose {
  const d = Number.isFinite(dt) ? clamp(dt, 0, MAX_DT) : 0;
  let ix = Number.isFinite(input.x) ? input.x : 0, iy = Number.isFinite(input.y) ? input.y : 0;
  const len = Math.hypot(ix, iy);
  if (len > 1) { ix /= len; iy /= len; }
  const dx = ix * SPEED * d, dz = -iy * SPEED * d;
  let heading = p.heading;
  if (dx !== 0 || dz !== 0) {
    const diff = normalise(Math.atan2(dz, dx) - heading);
    const maxTurn = TURN_SPEED * d;
    heading = normalise(heading + clamp(diff, -maxTurn, maxTurn));
  }
  const c = collide({ x: p.x + dx, z: p.z + dz }, PLAYER_R, geo.colliders, geo.bounds);
  return { x: c.x, z: c.z, heading };
}
