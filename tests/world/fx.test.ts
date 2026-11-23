import { describe, expect, it } from 'vitest';
import { createFpsMonitor, forcedFx, neonLevel } from '../../src/world/logic/fx';

function run(m: ReturnType<typeof createFpsMonitor>, fps: number, secs: number, spikeEvery = 0) {
  const n = Math.round(fps * secs);
  let firstLowAt = -1;
  let t = 0;
  for (let i = 1; i <= n; i++) {
    if (spikeEvery && i % spikeEvery === 0) m.sample(5);
    t += 1 / fps;
    if (m.sample(1 / fps) === 'low' && firstLowAt < 0) firstLowAt = t;
  }
  return firstLowAt;
}

describe('forcedFx', () => {
  it('parses url and env, url wins', () => {
    expect(forcedFx('?fx=low')).toBe('low');
    expect(forcedFx('', 'low')).toBe('low');
    expect(forcedFx('?fx=full', 'low')).toBe('full');
    expect(forcedFx('?a=1')).toBeNull();
  });
});

describe('fps monitor', () => {
  it('stays full at 60 fps', () => {
    const m = createFpsMonitor();
    for (let i = 0; i < 600; i++) m.sample(1 / 60);
    expect(m.mode).toBe('full');
  });
  it('goes low at 30 fps after >= 7 s', () => {
    const m = createFpsMonitor();
    const at = run(m, 30, 8);
    expect(m.mode).toBe('low');
    expect(at).toBeGreaterThanOrEqual(7 - 1e-6);
  });
  it('slow warmup then fast stays full', () => {
    const m = createFpsMonitor();
    run(m, 30, 3);
    run(m, 60, 10);
    expect(m.mode).toBe('full');
  });
  it('one slow window then fast stays full', () => {
    const m = createFpsMonitor();
    run(m, 60, 3);
    run(m, 30, 2);
    run(m, 60, 10);
    expect(m.mode).toBe('full');
  });
  it('ignores tab-switch dt spikes', () => {
    const m = createFpsMonitor();
    run(m, 60, 20, 100);
    expect(m.mode).toBe('full');
  });
  it('ignores invalid dt', () => {
    const m = createFpsMonitor();
    for (let i = 0; i < 100; i++) {
      m.sample(NaN);
      m.sample(0);
      m.sample(-1);
    }
    expect(m.mode).toBe('full');
  });
  it('latches low', () => {
    const m = createFpsMonitor();
    run(m, 30, 8);
    run(m, 60, 30);
    expect(m.mode).toBe('low');
  });
});

describe('neonLevel', () => {
  it('amp 0 gives base', () => {
    expect(neonLevel(1.25, 3.5, { amp: 0, hz: 0.4 })).toBe(3.5);
  });
  it('stays in range', () => {
    for (let t = 0; t < 10; t += 0.05) {
      const v = neonLevel(t, 3.5, { amp: 0.06, hz: 0.4 });
      expect(v).toBeGreaterThanOrEqual(3.29);
      expect(v).toBeLessThanOrEqual(3.71);
    }
  });
});
