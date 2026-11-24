import { describe, it, expect, vi } from 'vitest';
import { createWorldStore } from '../../src/world/store';
import { VISITED_KEY } from '../../src/world/logic/visited';
import { exhibits, EXHIBIT_COUNT } from '../../src/content';
import { SPAWN_POSE, type SceneGeometry, type Target } from '../../src/world/types';

function fake(initial?: string): Storage {
  const m = new Map<string, string>();
  if (initial) m.set(VISITED_KEY, initial);
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage;
}

const geo: SceneGeometry = {
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  colliders: [], doors: [], exits: [], exhibits: [{ id: 'basketball', pos: [3, 5] }],
  entrance: { x: 0, z: 8, heading: -Math.PI / 2 }, cameraDistance: 12,
};
const gym: Target = { scene: { kind: 'interior', id: 'gym' }, pose: null, panelId: 'basketball' };
const library: Target = { scene: { kind: 'interior', id: 'library' }, pose: null, panelId: null };

describe('world store', () => {
  it('has world defaults', () => {
    const s = createWorldStore(fake()).getState();
    expect(s.scene).toEqual({ kind: 'world' });
    expect(s.worldPose).toEqual(SPAWN_POSE);
    expect(s.spawn.pose).toEqual(SPAWN_POSE);
    expect(s.phase).toBe('idle');
    expect(s.pending).toBeNull();
    expect(s.geometry).toBeNull();
    expect(s.labelIds).toEqual([]);
    expect(s.mapOpen).toBe(false);
    expect(s.toast).toBeNull();
    expect(s.zoomIndex).toBe(1);
  });
  it('loads visited and drops stale ids', () => {
    const s = createWorldStore(fake(JSON.stringify(['tranquility-base', 'gone', 'books'])));
    expect(s.getState().visited).toEqual(['tranquility-base', 'books']);
  });
  it('visited loads up to all 46 exhibit ids', () => {
    const ids = exhibits.map((e) => e.id);
    expect(ids).toHaveLength(46);
    const s = createWorldStore(fake(JSON.stringify([...ids, 'extra', ids[0]])));
    expect(s.getState().visited).toHaveLength(EXHIBIT_COUNT);
    expect(s.getState().visited).toEqual(ids);
  });
  it('activate opens, records, persists once', () => {
    const st = fake();
    const s = createWorldStore(st);
    s.getState().activate('tranquility-base');
    expect(s.getState().activeId).toBe('tranquility-base');
    expect(s.getState().visited).toEqual(['tranquility-base']);
    expect(st.getItem(VISITED_KEY)).toContain('tranquility-base');
    s.getState().activate('tranquility-base');
    expect(s.getState().visited).toHaveLength(1);
  });
  it('openPanel accepts any exhibit (non-station) and ignores unknown ids; closePanel clears', () => {
    const s = createWorldStore(fake());
    s.getState().openPanel('nope');
    expect(s.getState().activeId).toBeNull();
    expect(s.getState().visited).toEqual([]);
    s.getState().openPanel('books');
    expect(s.getState().activeId).toBe('books');
    expect(s.getState().visited).toEqual(['books']);
    s.getState().openPanel('contact');
    s.getState().openPanel('rising-star');
    expect(s.getState().visited).toEqual(['books', 'contact', 'rising-star']);
    s.getState().closePanel();
    expect(s.getState().activeId).toBeNull();
  });
  it('unchanged setProximity does not notify', () => {
    const s = createWorldStore(fake());
    s.getState().setProximity('robotics', 'robotics');
    const fn = vi.fn();
    s.subscribe(fn);
    s.getState().setProximity('robotics', 'robotics');
    expect(fn).not.toHaveBeenCalled();
    s.getState().setProximity('robotics', null);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('spawnAt sets pose and bumps seq', () => {
    const s = createWorldStore(fake());
    const seq = s.getState().spawn.seq;
    const p = { x: 3, z: 4, heading: 1 };
    s.getState().spawnAt(p);
    expect(s.getState().spawn).toEqual({ pose: p, seq: seq + 1 });
    s.getState().spawnAt(SPAWN_POSE);
    expect(s.getState().spawn).toEqual({ pose: SPAWN_POSE, seq: seq + 2 });
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
    const s = createWorldStore(bad);
    s.getState().activate('tranquility-base');
    expect(s.getState().activeId).toBe('tranquility-base');
  });
  it('setFx / setAvatar update state; unchanged setFx does not notify', () => {
    const s = createWorldStore(fake());
    let n = 0;
    s.subscribe(() => n++);
    s.getState().setFx('low');
    expect(s.getState().fx).toBe('low');
    expect(n).toBe(1);
    s.getState().setFx('low');
    expect(n).toBe(1);
    s.getState().setAvatar('capsule');
    expect(s.getState().avatar).toBe('capsule');
  });

  describe('transitions', () => {
    it('go from idle → fading-out, pending set, panel and map cleared', () => {
      const s = createWorldStore(fake());
      s.getState().openPanel('books');
      s.getState().openMap();
      s.getState().go(gym);
      const st = s.getState();
      expect(st.phase).toBe('fading-out');
      expect(st.pending).toEqual(gym);
      expect(st.activeId).toBeNull();
      expect(st.mapOpen).toBe(false);
      expect(st.scene).toEqual({ kind: 'world' });
    });
    it('go instant → loading', () => {
      const s = createWorldStore(fake());
      s.getState().go(gym, { instant: true });
      expect(s.getState().phase).toBe('loading');
      expect(s.getState().pending).toEqual(gym);
    });
    it('full cycle: beginLoad, commit with panel, settle', () => {
      const s = createWorldStore(fake());
      const seq = s.getState().spawn.seq;
      s.getState().go(gym);
      s.getState().beginLoad();
      expect(s.getState().phase).toBe('loading');
      const pose = { x: 3, z: 6.5, heading: -Math.PI / 2 };
      s.getState().commit({ kind: 'interior', id: 'gym' }, geo, pose, 'basketball');
      const st = s.getState();
      expect(st.scene).toEqual({ kind: 'interior', id: 'gym' });
      expect(st.geometry).toBe(geo);
      expect(st.spawn).toEqual({ pose, seq: seq + 1 });
      expect(st.pending).toBeNull();
      expect(st.phase).toBe('fading-in');
      expect(st.activeId).toBe('basketball');
      expect(st.visited).toContain('basketball');
      s.getState().settle();
      expect(s.getState().phase).toBe('idle');
    });
    it('commit without panel leaves panel closed', () => {
      const s = createWorldStore(fake());
      s.getState().go(library, { instant: true });
      s.getState().commit(library.scene, geo, geo.entrance, null);
      expect(s.getState().activeId).toBeNull();
      expect(s.getState().phase).toBe('fading-in');
    });
    it('beginLoad only acts from fading-out; settle only from fading-in', () => {
      const s = createWorldStore(fake());
      s.getState().beginLoad();
      expect(s.getState().phase).toBe('idle');
      s.getState().settle();
      expect(s.getState().phase).toBe('idle');
      s.getState().go(gym, { instant: true });
      s.getState().settle();
      expect(s.getState().phase).toBe('loading');
    });
    it('RF3: go while loading replaces pending and stays loading', () => {
      const s = createWorldStore(fake());
      s.getState().go(gym);
      s.getState().beginLoad();
      s.getState().go(library);
      expect(s.getState().phase).toBe('loading');
      expect(s.getState().pending).toEqual(library);
    });
    it('go while fading-out replaces pending and stays fading-out', () => {
      const s = createWorldStore(fake());
      s.getState().go(gym);
      s.getState().go(library);
      expect(s.getState().phase).toBe('fading-out');
      expect(s.getState().pending).toEqual(library);
    });
    it('go while fading-in → fading-out', () => {
      const s = createWorldStore(fake());
      s.getState().go(gym, { instant: true });
      s.getState().commit(gym.scene, geo, geo.entrance, 'basketball');
      s.getState().go(library);
      expect(s.getState().phase).toBe('fading-out');
      expect(s.getState().pending).toEqual(library);
      expect(s.getState().activeId).toBeNull();
    });
  });

  it('setWorldPose / setLabels (equal array does not notify)', () => {
    const s = createWorldStore(fake());
    const p = { x: 1, z: 2, heading: 0 };
    s.getState().setWorldPose(p);
    expect(s.getState().worldPose).toEqual(p);
    s.getState().setLabels(['a', 'b']);
    expect(s.getState().labelIds).toEqual(['a', 'b']);
    const fn = vi.fn();
    s.subscribe(fn);
    s.getState().setLabels(['a', 'b']);
    expect(fn).not.toHaveBeenCalled();
    s.getState().setLabels(['b', 'a']);
    expect(fn).toHaveBeenCalledTimes(1);
    s.getState().setLabels(['b']);
    expect(s.getState().labelIds).toEqual(['b']);
  });
  it('map, zoom and toast setters', () => {
    const s = createWorldStore(fake());
    s.getState().openMap();
    expect(s.getState().mapOpen).toBe(true);
    s.getState().closeMap();
    expect(s.getState().mapOpen).toBe(false);
    s.getState().setZoom(2);
    expect(s.getState().zoomIndex).toBe(2);
    s.getState().setZoom(0);
    expect(s.getState().zoomIndex).toBe(0);
    s.getState().showToast("Couldn't open this building");
    expect(s.getState().toast).toBe("Couldn't open this building");
    s.getState().dismissToast();
    expect(s.getState().toast).toBeNull();
  });
});

describe('elevator state', () => {
  it('open / close / setPad are idempotent and go() closes the elevator', () => {
    const s = createWorldStore(fake());
    const calls = vi.fn();
    s.subscribe(calls);
    s.getState().openElevator();
    s.getState().openElevator();
    expect(calls).toHaveBeenCalledTimes(1);
    s.getState().setPad('elevator');
    s.getState().setPad('elevator');
    expect(calls).toHaveBeenCalledTimes(2);
    expect(s.getState().padId).toBe('elevator');
    s.getState().openMap();
    expect(s.getState().mapOpen).toBe(false);
    s.getState().go({ scene: { kind: 'world' }, pose: null, panelId: null });
    expect(s.getState().elevatorOpen).toBe(false);
    s.getState().closeElevator();
    expect(calls).toHaveBeenCalledTimes(3);
  });
});

describe('activeFocus', () => {
  it('is set by openPanel, cleared by closePanel, a plain open and go', () => {
    const store = createWorldStore(null);
    store.getState().openPanel('games', 'Halo');
    expect(store.getState().activeFocus).toBe('Halo');
    store.getState().closePanel();
    expect(store.getState().activeFocus).toBeNull();
    store.getState().openPanel('games', 'Halo');
    store.getState().openPanel('games');
    expect(store.getState().activeFocus).toBeNull();
    store.getState().openPanel('games', 'Halo');
    store.getState().go({ scene: { kind: 'world' }, pose: null, panelId: null });
    expect(store.getState().activeFocus).toBeNull();
  });
  it('focusSeq bumps on every focused open, even for the same focus', () => {
    const store = createWorldStore(null);
    store.getState().openPanel('games', 'Halo');
    const n = store.getState().focusSeq;
    store.getState().openPanel('games', 'Halo');
    expect(store.getState().focusSeq).toBe(n + 1);
    store.getState().openPanel('games');
    expect(store.getState().focusSeq).toBe(n + 1);
  });
  it('setProximity is idempotent including focus', () => {
    const store = createWorldStore(null);
    store.getState().setProximity('games', 'games', 'Halo');
    const a = store.getState();
    store.getState().setProximity('games', 'games', 'Halo');
    expect(store.getState()).toBe(a);
    store.getState().setProximity('games', 'games', 'Fortnite');
    expect(store.getState().nearFocus).toBe('Fortnite');
  });
});
