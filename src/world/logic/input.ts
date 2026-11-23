import { NO_INPUT, type MoveInput } from './movement';

const DEAD_ZONE = 0.15;

export function keysToInput(pressed: ReadonlySet<string>): MoveInput {
  const has = (...c: string[]) => c.some((k) => pressed.has(k));
  const y = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
  const x = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
  if (x === 0 && y === 0) return NO_INPUT;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
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
  return { x: v.x, y: v.y };
}

export function combineInput(a: MoveInput, b: MoveInput): MoveInput {
  const x = a.x + b.x, y = a.y + b.y;
  const len = Math.hypot(x, y);
  return len > 1 ? { x: x / len, y: y / len } : { x, y };
}
