export type FxMode = 'full' | 'low';

export function forcedFx(search: string, envFlag?: string): FxMode | null {
  const v = new URLSearchParams(search).get('fx');
  if (v === 'low' || v === 'full') return v;
  if (envFlag === 'low') return 'low';
  return null;
}

export const FPS_WARMUP_S = 3,
  FPS_WINDOW_S = 2,
  FPS_LOW = 40,
  FPS_STRIKES = 2,
  FPS_MAX_DT = 0.25;

export type FpsMonitor = { sample(dt: number): FxMode; readonly mode: FxMode };

export function createFpsMonitor(): FpsMonitor {
  let mode: FxMode = 'full';
  let elapsed = 0;
  let winTime = 0;
  let winFrames = 0;
  let strikes = 0;
  return {
    get mode() {
      return mode;
    },
    sample(dt: number): FxMode {
      if (mode === 'low') return mode;
      if (!Number.isFinite(dt) || dt <= 0 || dt > FPS_MAX_DT) return mode;
      elapsed += dt;
      if (elapsed < FPS_WARMUP_S) return mode;
      winTime += dt;
      winFrames += 1;
      if (winTime >= FPS_WINDOW_S - 1e-9) {
        if (winFrames / winTime < FPS_LOW) strikes += 1;
        else strikes = 0;
        winTime = 0;
        winFrames = 0;
        if (strikes >= FPS_STRIKES) mode = 'low';
      }
      return mode;
    },
  };
}

export function neonLevel(t: number, base: number, pulse: { amp: number; hz: number }): number {
  if (pulse.amp === 0) return base;
  return base * (1 + pulse.amp * Math.sin(2 * Math.PI * pulse.hz * t));
}
