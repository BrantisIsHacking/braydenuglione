import { describe, it, expect, vi } from 'vitest';
import { createArenaStore } from '../../src/arena/store';
import { VISITED_KEY } from '../../src/arena/logic/visited';
import { spawnFor } from '../../src/arena/logic/spawn';
import { SPAWN } from '../../src/arena/logic/court';
import { getStation } from '../../src/content';

function fake(initial?: string): Storage {
  const m = new Map<string, string>();
  if (initial) m.set(VISITED_KEY, initial);
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage;
}

describe('arena store', () => {
  it('loads visited and drops stale ids', () => {
    const s = createArenaStore(fake(JSON.stringify(['tranquility-base', 'gone'])));
    expect(s.getState().visited).toEqual(['tranquility-base']);
  });
  it('activate opens, records, persists once', () => {
    const st = fake();
    const s = createArenaStore(st);
    s.getState().activate('tranquility-base');
    expect(s.getState().activeId).toBe('tranquility-base');
    expect(s.getState().visited).toEqual(['tranquility-base']);
    expect(st.getItem(VISITED_KEY)).toContain('tranquility-base');
    s.getState().activate('tranquility-base');
    expect(s.getState().visited).toHaveLength(1);
  });
  it('ignores unknown ids; closePanel clears', () => {
    const s = createArenaStore(fake());
    s.getState().openPanel('nope');
    expect(s.getState().activeId).toBeNull();
    expect(s.getState().visited).toEqual([]);
    s.getState().openPanel('robotics');
    s.getState().closePanel();
    expect(s.getState().activeId).toBeNull();
  });
  it('unchanged setProximity does not notify', () => {
    const s = createArenaStore(fake());
    s.getState().setProximity('robotics', 'robotics');
    const fn = vi.fn();
    s.subscribe(fn);
    s.getState().setProximity('robotics', 'robotics');
    expect(fn).not.toHaveBeenCalled();
    s.getState().setProximity('robotics', null);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('spawnAt bumps seq and sets pose', () => {
    const s = createArenaStore(fake());
    const seq = s.getState().spawn.seq;
    s.getState().spawnAt('robotics');
    expect(s.getState().spawn.seq).toBe(seq + 1);
    expect(s.getState().spawn.pose).toEqual(spawnFor(getStation('robotics') as any));
    s.getState().spawnAt(null);
    expect(s.getState().spawn.pose).toEqual(SPAWN);
    expect(s.getState().spawn.seq).toBe(seq + 2);
  });
  it('throwing storage still activates', () => {
    const bad = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('x');
      },
    } as unknown as Storage;
    const s = createArenaStore(bad);
    s.getState().activate('tranquility-base');
    expect(s.getState().activeId).toBe('tranquility-base');
  });
});
