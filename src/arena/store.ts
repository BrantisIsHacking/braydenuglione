import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { getStation, stations } from '../content';
import { SPAWN, type Pose } from './logic/court';
import { spawnFor } from './logic/spawn';
import { loadVisited, safeLocalStorage, saveVisited } from './logic/visited';

export type ArenaState = {
  activeId: string | null;
  nearId: string | null;
  nearestId: string | null;
  visited: string[];
  spawn: { pose: Pose; seq: number };
  activate(id: string): void;
  openPanel(id: string): void;
  closePanel(): void;
  setProximity(nearestId: string | null, nearId: string | null): void;
  spawnAt(stationId: string | null): void;
};

export function createArenaStore(storage: Storage | null): UseBoundStore<StoreApi<ArenaState>> {
  const valid = new Set(stations.map((s) => s.id));
  return create<ArenaState>((set, get) => ({
    activeId: null,
    nearId: null,
    nearestId: null,
    visited: loadVisited(storage, valid),
    spawn: { pose: { ...SPAWN }, seq: 0 },
    // SEAM: Phase 4 routes this through the shot sequence before openPanel.
    activate: (id) => get().openPanel(id),
    openPanel: (id) => {
      if (!getStation(id)) return;
      const { visited } = get();
      if (visited.includes(id)) {
        set({ activeId: id });
        return;
      }
      const next = [...visited, id];
      set({ activeId: id, visited: next });
      saveVisited(storage, next);
    },
    closePanel: () => set({ activeId: null }),
    setProximity: (nearestId, nearId) => {
      const s = get();
      if (s.nearestId === nearestId && s.nearId === nearId) return;
      set({ nearestId, nearId });
    },
    spawnAt: (stationId) => {
      const st = stationId ? getStation(stationId) : undefined;
      set((s) => ({ spawn: { pose: spawnFor(st ?? null), seq: s.spawn.seq + 1 } }));
    },
  }));
}

export const useArena = createArenaStore(safeLocalStorage());
