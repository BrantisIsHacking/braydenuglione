export const MOVE_EPS = 0.05,
  RUN_FULL_AT = 2.0,
  RUN_REF_SPEED = 5.3;

export function locomotion(speed: number): { idle: number; run: number; timeScale: number } {
  if (!Number.isFinite(speed) || speed < 0) return { idle: 1, run: 0, timeScale: 1 };
  const x = Math.min(1, Math.max(0, (speed - MOVE_EPS) / (RUN_FULL_AT - MOVE_EPS)));
  const run = x * x * (3 - 2 * x);
  const timeScale = run > 0 ? Math.min(1.6, Math.max(0.8, speed / RUN_REF_SPEED)) : 1;
  return { idle: 1 - run, run, timeScale };
}

export function smoothSpeed(prev: number, raw: number, dt: number): number {
  if (!Number.isFinite(raw)) return prev;
  const k = 1 - Math.exp(-10 * dt);
  return prev + (raw - prev) * k;
}
