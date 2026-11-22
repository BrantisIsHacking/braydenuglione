import { NO_INPUT, type MoveInput } from './movement';

const clamp1 = (v: number) => Math.min(1, Math.max(-1, v));
const DEAD_ZONE = 0.15;

export function keysToInput(pressed: ReadonlySet<string>): MoveInput {
  const has = (...c: string[]) => c.some((k) => pressed.has(k));
  const forward = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
  const turn = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
  return forward === 0 && turn === 0 ? NO_INPUT : { forward, turn };
}

export function joystickVector(dx: number, dy: number, radius: number): { x: number; y: number } {
  if (!(radius > 0) || !Number.isFinite(dx) || !Number.isFinite(dy)) return { x: 0, y: 0 };
  let x = dx / radius, y = -dy / radius;
  const len = Math.hypot(x, y);
  if (len < DEAD_ZONE) return { x: 0, y: 0 };
  if (len > 1) { x /= len; y /= len; }
  return { x: x + 0, y: y + 0 };
}

export function joystickToInput(v: { x: number; y: number }): MoveInput {
  return { forward: v.y, turn: v.x };
}

export function combineInput(a: MoveInput, b: MoveInput): MoveInput {
  return { forward: clamp1(a.forward + b.forward), turn: clamp1(a.turn + b.turn) };
}
