import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WORLD_HASH, createHistorySync, hashFor, hashForScene, planRoute, sameScene, spawnPoseFor, targetForRoute,
  type RouteCtx,
} from '../../src/world/history';
import { createWorldStore, type WorldStore } from '../../src/world/store';
import { inFront, NORTH, SOUTH, SPAWN_POSE, type Pose, type SceneGeometry } from '../../src/world/types';
import type { Route } from '../../src/routing/routeWords';
import type { BuildingId } from '../../src/content/types';

const ids: BuildingId[] = [
  'scouting-office', 'hall-of-fame', 'mailbox', 'workshop', 'hq-tower', 'civic-center', 'campus-quad', 'gym',
  'golf-clubhouse', 'library', 'cinema', 'record-store', 'playhouse', 'arcade', 'fan-shop', 'chess-park', 'park', 'running-loop',
];
const exitPose = (id: BuildingId): Pose => ({ x: ids.indexOf(id), z: 100, heading: SOUTH });
const spotPose = (id: BuildingId): Pose => ({ x: ids.indexOf(id), z: 200, heading: NORTH });

/** Minimal fake of Task 3's parseRoute — enough for the adapter tests. */
function parse(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (h === '' || h === '/') return { view: 'auto' };
  if (h === '/world') return { view: 'world' };
  if (h === '/box-score') return { view: 'boxscore' };
  if (h === '/arena') return { view: 'building', id: 'gym', legacy: true };
  if (h.startsWith('/b/')) return { view: 'building', id: h.slice(3) as BuildingId, legacy: false };
  return { view: 'exhibit', id: h };
}

const worldPose: Pose = { x: 5, z: 6, heading: 0 };
const world = { kind: 'world' } as const;
const interior = (id: BuildingId) => ({ kind: 'interior', id }) as const;
const ctx = (over: Partial<RouteCtx> = {}): RouteCtx => ({ scene: world, activeId: null, worldPose, spotPose, ...over });

describe('history: hashes', () => {
  it('hashForScene / hashFor', () => {
    expect(WORLD_HASH).toBe('#/world');
    expect(hashForScene(world)).toBe('#/world');
    expect(hashForScene(interior('gym'))).toBe('#/b/gym');
    expect(hashFor(world, null)).toBe('#/world');
    expect(hashFor(interior('library'), null)).toBe('#/b/library');
    expect(hashFor(interior('library'), 'books')).toBe('#books');
    expect(hashFor(world, 'contact')).toBe('#contact');
  });
  it('sameScene', () => {
    expect(sameScene(world, { kind: 'world' })).toBe(true);
    expect(sameScene(interior('gym'), interior('gym'))).toBe(true);
    expect(sameScene(interior('gym'), interior('library'))).toBe(false);
    expect(sameScene(world, interior('gym'))).toBe(false);
  });
});

describe('history: targetForRoute', () => {
  const t = (r: Route, c = ctx()) => targetForRoute(r, c);
  it('auto and world → world at the stored world pose', () => {
    expect(t({ view: 'auto' })).toEqual({ scene: world, pose: worldPose, panelId: null });
    expect(t({ view: 'world' })).toEqual({ scene: world, pose: worldPose, panelId: null });
  });
  it('#/b/gym → interior gym; legacy alias the same', () => {
    expect(t(parse('#/b/gym'))).toEqual({ scene: interior('gym'), pose: null, panelId: null });
    expect(t(parse('#/arena'))).toEqual({ scene: interior('gym'), pose: null, panelId: null });
  });
  it('#/b/chess-park → world at the spot pose', () => {
    expect(t(parse('#/b/chess-park'))).toEqual({ scene: world, pose: spotPose('chess-park'), panelId: null });
  });
  it('#/b/scouting-office (overlay) and box score → boxscore', () => {
    expect(t(parse('#/b/scouting-office'))).toBe('boxscore');
    expect(t({ view: 'boxscore' })).toBe('boxscore');
  });
  it('#tranquility-base → interior workshop + panel', () => {
    expect(t(parse('#tranquility-base'))).toEqual({ scene: interior('workshop'), pose: null, panelId: 'tranquility-base' });
  });
  it('#chess → world + spotPose(chess-park) + panel', () => {
    expect(t(parse('#chess'))).toEqual({ scene: world, pose: spotPose('chess-park'), panelId: 'chess' });
  });
  it('RF5: mirrors never change the home building', () => {
    expect(t(parse('#rising-star'))).toEqual({ scene: interior('hall-of-fame'), pose: null, panelId: 'rising-star' });
    expect(t(parse('#critics-choice'))).toEqual({ scene: interior('campus-quad'), pose: null, panelId: 'critics-choice' });
    expect(t(parse('#oculogica'))).toEqual({ scene: interior('hq-tower'), pose: null, panelId: 'oculogica' });
    // even when already standing in a building that mirrors it
    expect(t(parse('#rising-star'), ctx({ scene: interior('gym') }))).toEqual({ scene: interior('hall-of-fame'), pose: null, panelId: 'rising-star' });
  });
  it('#contact → world + spotPose(mailbox) + panel', () => {
    expect(t(parse('#contact'))).toEqual({ scene: world, pose: spotPose('mailbox'), panelId: 'contact' });
  });
  it('unknown exhibit id → world at the stored pose, no panel (no throw)', () => {
    expect(t(parse('#nope'))).toEqual({ scene: world, pose: worldPose, panelId: null });
    expect(t({ view: 'building', id: 'nope' as BuildingId, legacy: false })).toEqual({ scene: world, pose: worldPose, panelId: null });
  });
});

describe('history: planRoute', () => {
  it('in workshop with panel tranquility-base: #/b/workshop → close panel', () => {
    const c = ctx({ scene: interior('workshop'), activeId: 'tranquility-base' });
    expect(planRoute(parse('#/b/workshop'), c)).toEqual({ kind: 'panel', panelId: null });
  });
  it('in workshop: #debate-mate → open that panel', () => {
    const c = ctx({ scene: interior('workshop'), activeId: 'tranquility-base' });
    expect(planRoute(parse('#debate-mate'), c)).toEqual({ kind: 'panel', panelId: 'debate-mate' });
  });
  it('in workshop with that panel open: #tranquility-base → none', () => {
    const c = ctx({ scene: interior('workshop'), activeId: 'tranquility-base' });
    expect(planRoute(parse('#tranquility-base'), c)).toEqual({ kind: 'none' });
  });
  it('in world: #/world → none; #/ → none', () => {
    expect(planRoute(parse('#/world'), ctx())).toEqual({ kind: 'none' });
    expect(planRoute(parse(''), ctx())).toEqual({ kind: 'none' });
  });
  it('in world with contact open: #/world → close panel', () => {
    expect(planRoute(parse('#/world'), ctx({ activeId: 'contact' }))).toEqual({ kind: 'panel', panelId: null });
  });
  it('in world: #/b/gym → go', () => {
    expect(planRoute(parse('#/b/gym'), ctx())).toEqual({ kind: 'go', target: { scene: interior('gym'), pose: null, panelId: null } });
  });
  it('in world: spot routes with a different pose → go', () => {
    expect(planRoute(parse('#/b/chess-park'), ctx())).toEqual({ kind: 'go', target: { scene: world, pose: spotPose('chess-park'), panelId: null } });
    expect(planRoute(parse('#chess'), ctx())).toEqual({ kind: 'go', target: { scene: world, pose: spotPose('chess-park'), panelId: 'chess' } });
  });
  it('in world already at the spot: #chess → panel', () => {
    expect(planRoute(parse('#chess'), ctx({ worldPose: spotPose('chess-park') }))).toEqual({ kind: 'panel', panelId: 'chess' });
  });
  it('in gym: #/world → go to the stored world pose', () => {
    expect(planRoute(parse('#/world'), ctx({ scene: interior('gym') }))).toEqual({ kind: 'go', target: { scene: world, pose: worldPose, panelId: null } });
  });
  it('in gym: #rising-star (mirror) → go to hall-of-fame', () => {
    expect(planRoute(parse('#rising-star'), ctx({ scene: interior('gym') }))).toEqual({
      kind: 'go', target: { scene: interior('hall-of-fame'), pose: null, panelId: 'rising-star' },
    });
  });
  it('boxscore and overlay → boxscore', () => {
    expect(planRoute(parse('#/box-score'), ctx())).toEqual({ kind: 'boxscore' });
    expect(planRoute(parse('#/b/scouting-office'), ctx())).toEqual({ kind: 'boxscore' });
  });
});

describe('history: spawnPoseFor', () => {
  const g: SceneGeometry = {
    bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, colliders: [], doors: [], exits: [],
    exhibits: [{ id: 'basketball', pos: [3, 5] }], entrance: { x: 0, z: 9, heading: NORTH }, cameraDistance: 12,
  };
  it('explicit pose wins', () => {
    const p = { x: 1, z: 1, heading: 0 };
    expect(spawnPoseFor({ scene: interior('gym'), pose: p, panelId: 'basketball' }, g)).toEqual(p);
  });
  it('placed panel → in front of it', () => {
    expect(spawnPoseFor({ scene: interior('gym'), pose: null, panelId: 'basketball' }, g)).toEqual(inFront([3, 5]));
  });
  it('unplaced panel or no panel → entrance', () => {
    expect(spawnPoseFor({ scene: interior('gym'), pose: null, panelId: 'books' }, g)).toEqual(g.entrance);
    expect(spawnPoseFor({ scene: interior('gym'), pose: null, panelId: null }, g)).toEqual(g.entrance);
  });
});

// ---------------------------------------------------------------- adapter (jsdom, real window.history)

const geo: SceneGeometry = {
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, colliders: [], doors: [], exits: [], exhibits: [],
  entrance: { x: 0, z: 9, heading: NORTH }, cameraDistance: 12,
};
const nextPop = () => new Promise<void>((res) => window.addEventListener('popstate', () => res(), { once: true }));
/** Run the full fade for whatever is pending (what SceneSwitcher does in Task 19). */
function finish(store: WorldStore) {
  const s = store.getState();
  const t = s.pending;
  if (!t) throw new Error('nothing pending');
  if (s.phase === 'fading-out') s.beginLoad();
  store.getState().commit(t.scene, geo, spawnPoseFor(t, geo), t.panelId);
  store.getState().settle();
}

describe('history: adapter', () => {
  let store: WorldStore;
  let toBoxScore: ReturnType<typeof vi.fn>;
  let sync: ReturnType<typeof createHistorySync>;
  const make = () => {
    sync = createHistorySync({ win: window, store, parse, exitPose, spotPose, toBoxScore });
    return sync;
  };

  beforeEach(() => {
    // push (not replace) so forward entries left by earlier tests' back() are truncated
    window.history.pushState(null, '', '#/world');
    store = createWorldStore(null);
    toBoxScore = vi.fn();
  });
  afterEach(() => {
    sync?.dispose();
    vi.restoreAllMocks();
  });

  it('start() on #/b/gym → pending gym, loading, worldPose at the gym exit, no URL write', () => {
    window.history.replaceState(null, '', '#/b/gym');
    const len = window.history.length;
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    make().start();
    const s = store.getState();
    expect(s.pending).toEqual({ scene: interior('gym'), pose: null, panelId: null });
    expect(s.phase).toBe('loading');
    expect(s.worldPose).toEqual(exitPose('gym'));
    expect(window.history.length).toBe(len);
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('start() on #/world → world at spawn (instant), on an exhibit → home + panel after commit', () => {
    make().start();
    expect(store.getState().pending).toEqual({ scene: world, pose: SPAWN_POSE, panelId: null });
    expect(store.getState().phase).toBe('loading');
    sync.dispose();
    window.history.replaceState(null, '', '#tranquility-base');
    store = createWorldStore(null);
    make().start();
    expect(store.getState().pending).toEqual({ scene: interior('workshop'), pose: null, panelId: 'tranquility-base' });
    finish(store);
    expect(store.getState().activeId).toBe('tranquility-base');
    expect(window.location.hash).toBe('#tranquility-base');
  });

  it('start() on a box-score or overlay route calls toBoxScore', () => {
    window.history.replaceState(null, '', '#/b/scouting-office');
    make().start();
    expect(toBoxScore).toHaveBeenCalledTimes(1);
    expect(store.getState().pending).toBeNull();
  });

  it('travel, panel replace, close, Back restores the world pose', async () => {
    make().start();
    finish(store);
    const len = window.history.length;
    sync.travel('#/b/library');
    expect(window.history.length).toBe(len + 1);
    expect(window.location.hash).toBe('#/b/library');
    expect(store.getState().worldPose).toEqual(exitPose('library'));
    expect(store.getState().pending).toEqual({ scene: interior('library'), pose: null, panelId: null });
    expect(store.getState().phase).toBe('fading-out');
    finish(store);

    store.getState().openPanel('books');
    expect(window.location.hash).toBe('#books');
    expect(window.history.length).toBe(len + 1);
    store.getState().closePanel();
    expect(window.location.hash).toBe('#/b/library');
    expect(window.history.length).toBe(len + 1);

    const push = vi.spyOn(window.history, 'pushState');
    const popped = nextPop();
    window.history.back();
    await popped;
    expect(window.location.hash).toBe('#/world');
    expect(store.getState().pending).toEqual({ scene: world, pose: exitPose('library'), panelId: null });
    expect(store.getState().phase).toBe('fading-out');
    expect(push).not.toHaveBeenCalled();
    expect(window.history.length).toBe(len + 1);

    // Forward goes back in
    finish(store);
    const fwd = nextPop();
    window.history.forward();
    await fwd;
    expect(store.getState().pending).toEqual({ scene: interior('library'), pose: null, panelId: null });
  });

  it('travel to an exhibit pushes its hash and opens the panel on commit without another write', () => {
    make().start();
    finish(store);
    const len = window.history.length;
    sync.travel('#debate-mate');
    expect(window.location.hash).toBe('#debate-mate');
    expect(window.history.length).toBe(len + 1);
    const replace = vi.spyOn(window.history, 'replaceState');
    const push = vi.spyOn(window.history, 'pushState');
    finish(store);
    expect(store.getState().activeId).toBe('debate-mate');
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('travel within the same scene: panel → replaceState, none → nothing', () => {
    window.history.replaceState(null, '', '#/b/workshop');
    make().start();
    finish(store);
    const len = window.history.length;
    sync.travel('#debate-mate');
    expect(store.getState().activeId).toBe('debate-mate');
    expect(store.getState().pending).toBeNull();
    expect(window.location.hash).toBe('#debate-mate');
    expect(window.history.length).toBe(len);
    sync.travel('#/b/workshop');
    expect(store.getState().activeId).toBeNull();
    expect(window.location.hash).toBe('#/b/workshop');
    const replace = vi.spyOn(window.history, 'replaceState');
    const push = vi.spyOn(window.history, 'pushState');
    sync.travel('#/b/workshop');
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('travel to a spot sets no exit pose and pushes', () => {
    make().start();
    finish(store);
    const len = window.history.length;
    sync.travel('#contact');
    expect(window.history.length).toBe(len + 1);
    expect(store.getState().pending).toEqual({ scene: world, pose: spotPose('mailbox'), panelId: 'contact' });
    expect(store.getState().worldPose).toEqual(SPAWN_POSE);
  });

  it('RF3: popstate while fading-out replaces pending', async () => {
    make().start();
    finish(store);
    sync.travel('#/b/gym');
    finish(store);
    sync.travel('#/b/library');
    expect(store.getState().phase).toBe('fading-out');
    const popped = nextPop();
    window.history.back();
    await popped;
    expect(window.location.hash).toBe('#/b/gym');
    expect(store.getState().pending).toEqual({ scene: interior('gym'), pose: null, panelId: null });
    expect(store.getState().phase).toBe('fading-out');
    expect(store.getState().worldPose).toEqual(exitPose('gym'));
  });

  it('RF3: Back mid-fade to the scene we are leaving still goes there (URL and scene agree)', async () => {
    make().start();
    finish(store);
    sync.travel('#/b/library');
    store.getState().beginLoad();
    const popped = nextPop();
    window.history.back();
    await popped;
    expect(window.location.hash).toBe('#/world');
    expect(store.getState().pending).toEqual({ scene: world, pose: exitPose('library'), panelId: null });
    expect(store.getState().phase).toBe('loading');
    finish(store);
    expect(store.getState().scene).toEqual(world);
  });

  it('a door hit while a map jump is loading pushes once and replaces pending', () => {
    make().start();
    finish(store);
    const len = window.history.length;
    sync.travel('#/b/library');
    store.getState().beginLoad();
    sync.travel('#/b/gym');
    expect(window.history.length).toBe(len + 2);
    expect(store.getState().pending).toEqual({ scene: interior('gym'), pose: null, panelId: null });
    expect(store.getState().phase).toBe('loading');
    // same target again while pending → no new entry
    sync.travel('#/b/gym');
    expect(window.history.length).toBe(len + 2);
  });

  it('commit with a panel during fading-in writes nothing', () => {
    make().start();
    finish(store);
    sync.travel('#books');
    const replace = vi.spyOn(window.history, 'replaceState');
    const push = vi.spyOn(window.history, 'pushState');
    const t = store.getState().pending!;
    store.getState().beginLoad();
    store.getState().commit(t.scene, geo, geo.entrance, 'books');
    expect(store.getState().phase).toBe('fading-in');
    expect(store.getState().activeId).toBe('books');
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('activeId changes while not idle write nothing', () => {
    make().start();
    const replace = vi.spyOn(window.history, 'replaceState');
    store.getState().openPanel('books'); // phase 'loading', pending set
    expect(replace).not.toHaveBeenCalled();
  });

  it('settle reconciles a panel closed during fade-in (replace, no push)', () => {
    make().start();
    finish(store);
    sync.travel('#books');
    const t = store.getState().pending!;
    store.getState().beginLoad();
    store.getState().commit(t.scene, geo, geo.entrance, 'books');
    store.getState().closePanel(); // during fading-in: no write yet
    expect(window.location.hash).toBe('#books');
    const push = vi.spyOn(window.history, 'pushState');
    store.getState().settle();
    expect(window.location.hash).toBe('#/b/library');
    expect(push).not.toHaveBeenCalled();
  });

  it('settle reconciles a panel opened during fade-in', () => {
    make().start();
    finish(store);
    sync.travel('#/b/library');
    const t = store.getState().pending!;
    store.getState().beginLoad();
    store.getState().commit(t.scene, geo, geo.entrance, null);
    store.getState().openPanel('books');
    store.getState().settle();
    expect(window.location.hash).toBe('#books');
  });

  it('settle does not canonicalise #/b/chess-park', () => {
    window.history.replaceState(null, '', '#/b/chess-park');
    make().start();
    const replace = vi.spyOn(window.history, 'replaceState');
    finish(store);
    expect(window.location.hash).toBe('#/b/chess-park');
    expect(replace).not.toHaveBeenCalled();
  });

  it("travel('#/b/scouting-office') → toBoxScore once, no push", () => {
    make().start();
    finish(store);
    const len = window.history.length;
    const push = vi.spyOn(window.history, 'pushState');
    sync.travel('#/b/scouting-office');
    expect(toBoxScore).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(window.history.length).toBe(len);
    expect(store.getState().pending).toBeNull();
  });

  it('popstate to #/box-score does not call toBoxScore (App owns that switch)', async () => {
    make().start();
    finish(store);
    window.history.pushState(null, '', '#/box-score');
    window.history.pushState(null, '', '#/world');
    const popped = nextPop();
    window.history.back();
    await popped;
    expect(window.location.hash).toBe('#/box-score');
    expect(toBoxScore).not.toHaveBeenCalled();
    expect(store.getState().pending).toBeNull();
  });

  it('hashchange (typed URL) applies without writing the URL', () => {
    make().start();
    finish(store);
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    window.history.replaceState(null, '', '#/b/arcade');
    replace.mockClear();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(store.getState().pending).toEqual({ scene: interior('arcade'), pose: null, panelId: null });
    expect(store.getState().worldPose).toEqual(exitPose('arcade'));
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    // the paired popstate for the same navigation is a no-op
    const pend = store.getState().pending;
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(store.getState().pending).toBe(pend);
  });

  it('popstate with a panel-only change opens it without writing the URL', () => {
    window.history.replaceState(null, '', '#/b/workshop');
    make().start();
    finish(store);
    const replace = vi.spyOn(window.history, 'replaceState');
    window.history.pushState(null, '', '#debate-mate');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(store.getState().activeId).toBe('debate-mate');
    expect(store.getState().pending).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('hostile hashes do not throw', () => {
    make().start();
    finish(store);
    for (const h of ['#/b/', '#/b/tranquility-base', '#%E0%A4%A', '#/b/nope']) {
      expect(() => sync.travel(h)).not.toThrow();
    }
  });

  it('restore() rewrites the hash to the current scene and panel', () => {
    window.history.replaceState(null, '', '#/b/gym');
    make().start();
    finish(store);
    window.history.replaceState(null, '', '#/box-score');
    const len = window.history.length;
    sync.restore();
    expect(window.location.hash).toBe('#/b/gym');
    expect(window.history.length).toBe(len);
    store.getState().openPanel('basketball');
    window.history.replaceState(null, '', '#/box-score');
    sync.restore();
    expect(window.location.hash).toBe('#basketball');
  });

  it('dispose() stops listening to popstate, hashchange and the store', () => {
    make().start();
    finish(store);
    sync.dispose();
    window.history.replaceState(null, '', '#/b/gym');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(store.getState().pending).toBeNull();
    store.getState().openPanel('books');
    expect(window.location.hash).toBe('#/b/gym');
  });
});
