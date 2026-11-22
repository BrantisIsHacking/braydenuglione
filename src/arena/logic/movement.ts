import { PLAY_BOUNDS, type Bounds, type Pose } from './court';

export const SPEED = 6, TURN_RATE = 2.6, MAX_DT = 0.05;
export type MoveInput = { forward: number; turn: number };
export const NO_INPUT: MoveInput = { forward: 0, turn: 0 };

const TWO_PI = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function normalise(h: number): number {
  const r = h - TWO_PI * Math.ceil((h - Math.PI) / TWO_PI);
  return r <= -Math.PI ? r + TWO_PI : r;
}

export function step(p: Pose, input: MoveInput, dt: number, b: Bounds = PLAY_BOUNDS): Pose {
  const d = Number.isFinite(dt) ? clamp(dt, 0, MAX_DT) : 0;
  const heading = normalise(p.heading + input.turn * TURN_RATE * d);
  const dist = input.forward * SPEED * d;
  return {
    x: clamp(p.x + Math.cos(heading) * dist, b.minX, b.maxX),
    z: clamp(p.z + Math.sin(heading) * dist, b.minZ, b.maxZ),
    heading,
  };
}
