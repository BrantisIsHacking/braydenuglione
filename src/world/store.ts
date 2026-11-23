import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { EXHIBIT_COUNT, exhibits, getExhibit } from '../content';
import type { FxMode } from './logic/fx';
import { SPAWN_POSE, type Pose, type Scene, type SceneGeometry, type Target, type ZoomIndex } from './types';
import { loadVisited, safeLocalStorage, saveVisited } from './logic/visited';

export type Phase = 'idle' | 'fading-out' | 'loading' | 'fading-in';

export type WorldState = {
  activeId: string | null;
  nearId: string | null;
  nearestId: string | null;
  visited: string[];
  spawn: { pose: Pose; seq: number };
  fx: FxMode;
  avatar: 'loading' | 'model' | 'capsule';
  scene: Scene;
  /** Last outdoor pose; Back / Box Score round trips restore it. */
  worldPose: Pose;
  phase: Phase;
  pending: Target | null;
  geometry: SceneGeometry | null;
  labelIds: string[];
  mapOpen: boolean;
  toast: string | null;
  zoomIndex: ZoomIndex;
  activate(id: string): void;
  openPanel(id: string): void;
  closePanel(): void;
  setProximity(nearestId: string | null, nearId: string | null): void;
  setFx(m: FxMode): void;
  setAvatar(s: 'loading' | 'model' | 'capsule'): void;
  go(target: Target, opts?: { instant?: boolean }): void;
  beginLoad(): void;
  commit(scene: Scene, geometry: SceneGeometry, pose: Pose, panelId: string | null): void;
  settle(): void;
  spawnAt(pose: Pose): void;
  setWorldPose(p: Pose): void;
  setLabels(ids: string[]): void;
  openMap(): void;
  closeMap(): void;
  setZoom(i: ZoomIndex): void;
  showToast(m: string): void;
  dismissToast(): void;
};

export type WorldStore = UseBoundStore<StoreApi<WorldState>>;

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function createWorldStore(storage: Storage | null): WorldStore {
  const valid = new Set(exhibits.map((e) => e.id));
  return create<WorldState>((set, get) => ({
    activeId: null,
    nearId: null,
    nearestId: null,
    visited: loadVisited(storage, valid),
    spawn: { pose: { ...SPAWN_POSE }, seq: 0 },
    fx: 'full',
    avatar: 'loading',
    scene: { kind: 'world' },
    worldPose: { ...SPAWN_POSE },
    phase: 'idle',
    pending: null,
    geometry: null,
    labelIds: [],
    mapOpen: false,
    toast: null,
    zoomIndex: 1,
    // SEAM: Phase 4 routes this through the shot sequence before openPanel.
    activate: (id) => get().openPanel(id),
    openPanel: (id) => {
      if (!getExhibit(id)) return;
      const { visited } = get();
      if (visited.includes(id) || visited.length >= EXHIBIT_COUNT) {
        set({ activeId: id });
        return;
      }
      const next = [...visited, id];
      set({ activeId: id, visited: next });
      saveVisited(storage, next);
    },
    closePanel: () => {
      if (get().activeId !== null) set({ activeId: null });
    },
    setProximity: (nearestId, nearId) => {
      const s = get();
      if (s.nearestId === nearestId && s.nearId === nearId) return;
      set({ nearestId, nearId });
    },
    setFx: (m) => {
      if (get().fx !== m) set({ fx: m });
    },
    setAvatar: (a) => {
      if (get().avatar !== a) set({ avatar: a });
    },
    go: (target, opts) => {
      const cur = get().phase;
      const phase: Phase = opts?.instant ? 'loading' : cur === 'idle' || cur === 'fading-in' ? 'fading-out' : cur;
      set({ pending: target, phase, activeId: null, mapOpen: false });
    },
    beginLoad: () => {
      if (get().phase === 'fading-out') set({ phase: 'loading' });
    },
    commit: (scene, geometry, pose, panelId) => {
      set((s) => ({ scene, geometry, spawn: { pose, seq: s.spawn.seq + 1 }, pending: null, phase: 'fading-in' }));
      if (panelId) get().openPanel(panelId);
    },
    settle: () => {
      if (get().phase === 'fading-in') set({ phase: 'idle' });
    },
    spawnAt: (pose) => {
      set((s) => ({ spawn: { pose, seq: s.spawn.seq + 1 } }));
    },
    setWorldPose: (p) => set({ worldPose: p }),
    setLabels: (ids) => {
      if (!sameIds(get().labelIds, ids)) set({ labelIds: ids });
    },
    openMap: () => {
      if (!get().mapOpen) set({ mapOpen: true });
    },
    closeMap: () => {
      if (get().mapOpen) set({ mapOpen: false });
    },
    setZoom: (i) => {
      if (get().zoomIndex !== i) set({ zoomIndex: i });
    },
    showToast: (m) => set({ toast: m }),
    dismissToast: () => {
      if (get().toast !== null) set({ toast: null });
    },
  }));
}

export const useWorld = createWorldStore(safeLocalStorage());
