import { getBuilding, getExhibit, homeBuilding, isFloor } from '../content';
import type { BuildingId } from '../content/types';
import type { Route } from '../routing/routeWords';
import type { WorldStore } from './store';
import { inFront, NORTH, type Pose, type Scene, type SceneGeometry, type Target } from './types';

export const WORLD_HASH = '#/world';

/** Where a stairwell drops you: the landing by the south exit, facing north. */
export const STAIR_LANDING: Pose = { x: 0, z: -2, heading: NORTH };

export function hashForScene(s: Scene): string {
  if (s.kind === 'world') return WORLD_HASH;
  return s.floor !== undefined && s.floor >= 2 ? `#/b/${s.id}/${s.floor}` : `#/b/${s.id}`;
}

export function hashFor(s: Scene, panelId: string | null): string {
  return panelId ? `#${panelId}` : hashForScene(s);
}

export function sameScene(a: Scene, b: Scene): boolean {
  if (a.kind === 'world' || b.kind === 'world') return a.kind === b.kind;
  return a.id === b.id && (a.floor ?? 1) === (b.floor ?? 1);
}

function samePose(a: Pose | null, b: Pose | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.z === b.z && a.heading === b.heading;
}

function sameTarget(a: Target, b: Target): boolean {
  return sameScene(a.scene, b.scene) && samePose(a.pose, b.pose) && a.panelId === b.panelId;
}

export type RouteCtx = { scene: Scene; activeId: string | null; worldPose: Pose; spotPose(id: BuildingId): Pose };

/** Where a building (or an exhibit's home building) puts the player. Mirrors never change the home. */
function targetForBuilding(id: BuildingId, panelId: string | null, ctx: RouteCtx, floor?: number): Target | 'boxscore' {
  const b = getBuilding(id);
  if (!b) return { scene: { kind: 'world' }, pose: ctx.worldPose, panelId: null };
  if (b.kind === 'overlay') return 'boxscore';
  if (b.kind === 'spot') return { scene: { kind: 'world' }, pose: ctx.spotPose(b.id), panelId };
  return { scene: floor !== undefined ? { kind: 'interior', id: b.id, floor } : { kind: 'interior', id: b.id }, pose: null, panelId };
}

export function targetForRoute(r: Route, ctx: RouteCtx): Target | 'boxscore' {
  switch (r.view) {
    case 'boxscore':
      return 'boxscore';
    case 'building':
      return targetForBuilding(r.id, null, ctx, r.floor);
    case 'exhibit': {
      const home = getExhibit(r.id) ? homeBuilding(r.id) : undefined;
      if (!home) return { scene: { kind: 'world' }, pose: ctx.worldPose, panelId: null };
      return targetForBuilding(home, r.id, ctx, getExhibit(r.id)?.type === 'station' ? (getExhibit(r.id) as { floor?: number }).floor : undefined);
    }
    default: // 'auto' | 'world'
      return { scene: { kind: 'world' }, pose: ctx.worldPose, panelId: null };
  }
}

export type Plan = { kind: 'none' } | { kind: 'panel'; panelId: string | null } | { kind: 'go'; target: Target } | { kind: 'boxscore' };

export function planRoute(r: Route, ctx: RouteCtx): Plan {
  const target = targetForRoute(r, ctx);
  if (target === 'boxscore') return { kind: 'boxscore' };
  const stay =
    sameScene(target.scene, ctx.scene) &&
    (target.pose === null || (ctx.scene.kind === 'world' && samePose(target.pose, ctx.worldPose)));
  if (!stay) return { kind: 'go', target };
  return target.panelId !== ctx.activeId ? { kind: 'panel', panelId: target.panelId } : { kind: 'none' };
}

export function spawnPoseFor(t: Target, g: SceneGeometry): Pose {
  if (t.pose) return t.pose;
  if (t.panelId) {
    const placed = g.exhibits.find((e) => e.id === t.panelId);
    if (placed) return inFront(placed.pos);
  }
  return g.entrance;
}

export type HistorySync = {
  start(): void;
  travel(hash: string): void;
  /** Elevator or stairs: replaceState to another floor of the current building. */
  ride(floor: number, opts?: { stairs?: boolean; padId?: string }): void;
  /** The south exit: stairs down on floors above 1, out of the building otherwise. */
  exit(): void;
  restore(): void;
  dispose(): void;
};

export type HistoryDeps = {
  win: Window;
  store: WorldStore;
  parse(hash: string): Route;
  exitPose(id: BuildingId): Pose;
  spotPose(id: BuildingId): Pose;
  toBoxScore(): void;
  /** The player's live outdoor pose. Fast travel to a spot stores it in the history entry it leaves, so Back restores it. */
  livePose?(): Pose;
  /** Reduced motion: scene changes skip the fade-out. */
  reducedMotion?: boolean;
};

/**
 * The only code that writes `history`. Pushes on scene changes (doors, exits, fast travel),
 * replaces on panel open/close, applies Back/Forward and typed hashes without writing.
 */
export function createHistorySync(d: HistoryDeps): HistorySync {
  const { win, store } = d;
  let applying = false;
  /**
   * Hash last written or applied by this module; a second event for the same navigation is ignored.
   * Invariant: only this module and App's Box Score switch (Skip link, Scouting Office / toBoxScore,
   * the Box Score's Explore, the legacy #/arena replace) write the URL. Anything else writing the hash
   * would desync `current` from the store and break this dedupe.
   */
  let current: string | null = null;
  let unsubscribe: (() => void) | null = null;

  const ctx = (): RouteCtx => {
    const s = store.getState();
    return { scene: s.scene, activeId: s.activeId, worldPose: s.worldPose, spotPose: d.spotPose };
  };

  const parseSafe = (hash: string): Route => {
    try {
      return d.parse(hash);
    } catch {
      return { view: 'auto' };
    }
  };

  /** While a transition is in flight, plan against the pending target, not the scene being left. */
  const plan = (r: Route): Plan => {
    const s = store.getState();
    if (!s.pending) return planRoute(r, ctx());
    const t = targetForRoute(r, ctx());
    if (t === 'boxscore') return { kind: 'boxscore' };
    return sameTarget(t, s.pending) ? { kind: 'none' } : { kind: 'go', target: t };
  };

  const write = (kind: 'push' | 'replace', hash: string) => {
    current = hash;
    if (win.location.hash === hash && kind === 'replace') return;
    if (kind === 'push') win.history.pushState(null, '', hash);
    else win.history.replaceState(null, '', hash);
  };

  const withApply = (fn: () => void) => {
    applying = true;
    try {
      fn();
    } finally {
      applying = false;
    }
  };

  const applyGo = (t: Target, instant: boolean) =>
    withApply(() => {
      const s = store.getState();
      if (t.scene.kind === 'interior') s.setWorldPose(d.exitPose(t.scene.id));
      store.getState().go(t, { instant: instant || !!d.reducedMotion });
    });

  const applyPanel = (panelId: string | null) =>
    withApply(() => {
      const s = store.getState();
      if (panelId) s.openPanel(panelId);
      else s.closePanel();
    });

  /** The pre-travel pose stored on a history entry by `travel` (world to spot), if any. */
  const storedPose = (): Pose | null => {
    const v = (win.history.state as { pose?: Partial<Pose> } | null)?.pose;
    return v && Number.isFinite(v.x) && Number.isFinite(v.z) && Number.isFinite(v.heading) ? (v as Pose) : null;
  };

  const onNav = () => {
    const hash = win.location.hash;
    if (hash === current) return;
    current = hash;
    const route = parseSafe(hash);
    const back = storedPose();
    if (back && (route.view === 'auto' || route.view === 'world')) {
      // Back to the entry a spot fast-travel left: return to where the player stood, not to the stale saved pose.
      const target: Target = { scene: { kind: 'world' }, pose: back, panelId: null };
      const s = store.getState();
      const at = s.pending ? sameTarget(target, s.pending) : s.scene.kind === 'world' && d.livePose && samePose(d.livePose(), back);
      if (!at) applyGo(target, false);
      return;
    }
    const p = plan(route);
    if (p.kind === 'go') applyGo(p.target, false);
    else if (p.kind === 'panel') applyPanel(p.panelId);
    else if (p.kind === 'none' && store.getState().activeFocus !== null) applyPanel(store.getState().activeId); // same panel re-requested: drop the stale focus
    // 'boxscore' is ignored here: App owns that screen switch.
  };

  const api: HistorySync = {
    start() {
      win.addEventListener('popstate', onNav);
      win.addEventListener('hashchange', onNav);
      unsubscribe = store.subscribe((s, prev) => {
        if (applying) return;
        if (s.phase !== 'idle' || s.pending !== null) return;
        const settled = prev.phase !== 'idle' || prev.pending !== null;
        if (!settled) {
          if (s.activeId !== prev.activeId) write('replace', hashFor(s.scene, s.activeId));
          return;
        }
        // On settle, reconcile only a panel opened or closed during the fade-in: rewrite when the panel the
        // URL implies differs from the open one (never a canonical rewrite, so #/b/chess-park stays).
        const implied = targetForRoute(parseSafe(win.location.hash), ctx());
        const impliedPanel = implied === 'boxscore' ? null : implied.panelId;
        if (impliedPanel !== s.activeId) write('replace', hashFor(s.scene, s.activeId));
      });
      current = win.location.hash;
      const t = targetForRoute(parseSafe(current), ctx());
      if (t === 'boxscore') d.toBoxScore();
      else applyGo(t, true);
    },
    travel(hash) {
      const p = plan(parseSafe(hash));
      if (p.kind === 'boxscore') d.toBoxScore();
      else if (p.kind === 'go') {
        const s = store.getState();
        const leaving = s.scene.kind === 'world' && s.pending === null && s.phase === 'idle' ? d.livePose?.() : undefined;
        if (leaving && p.target.scene.kind === 'world') {
          // Spot to spot or world to spot: remember where the player stood so Back can return there.
          win.history.replaceState({ pose: { x: leaving.x, z: leaving.z, heading: leaving.heading } }, '', win.location.hash);
        } else if (storedPose()) {
          // A different departure from this entry (a door): Back must use the door's exit pose, not an older stored one.
          win.history.replaceState(null, '', win.location.hash);
        }
        write('push', hashFor(p.target.scene, p.target.panelId));
        applyGo(p.target, false);
      } else if (p.kind === 'panel') {
        write('replace', hashFor(store.getState().scene, p.panelId));
        applyPanel(p.panelId);
      } else if (p.kind === 'none' && store.getState().activeFocus !== null) applyPanel(store.getState().activeId);
    },
    ride(floor, opts) {
      const s = store.getState();
      if (s.scene.kind !== 'interior' || s.activeId !== null || s.pending !== null || s.phase !== 'idle') return;
      const { id } = s.scene;
      if (!isFloor(id, floor) || floor === (s.scene.floor ?? 1)) return;
      s.closeElevator();
      const next: Scene = { kind: 'interior', id, floor };
      write('replace', hashForScene(next));
      const pad = s.geometry?.pads?.find((p) => p.id === (opts?.padId ?? 'elevator'));
      applyGo({ scene: next, pose: opts?.stairs ? STAIR_LANDING : (pad?.arrival ?? null), panelId: null }, false);
    },
    exit() {
      const s = store.getState();
      const floor = s.scene.kind === 'interior' ? (s.scene.floor ?? 1) : 1;
      if (floor > 1) api.ride(floor - 1, { stairs: true });
      else api.travel('#/world');
    },
    restore() {
      const s = store.getState();
      write('replace', hashFor(s.scene, s.activeId));
    },
    dispose() {
      win.removeEventListener('popstate', onNav);
      win.removeEventListener('hashchange', onNav);
      unsubscribe?.();
      unsubscribe = null;
    },
  };
  return api;
}
