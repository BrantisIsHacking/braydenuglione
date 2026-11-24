import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { Scene, SceneModule, SceneProps } from '../../src/world/types';

const reg = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../src/world/interiors/registry', () => ({ loadScene: (s: unknown) => reg.load(s), prefetchScene: () => {} }));

import { SceneSwitcher } from '../../src/world/scene/SceneSwitcher';
import { createWorldStore, type WorldStore } from '../../src/world/store';
import { spawnPoseFor } from '../../src/world/history';
import { exitPose } from '../../src/world/logic/layout';
import { theme } from '../../src/world/look/theme';
import { NORTH, type SceneGeometry } from '../../src/world/types';

const geoFor = (id: string | null): SceneGeometry => ({
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, colliders: [], doors: [], exits: [],
  exhibits: id === 'workshop' ? [{ id: 'tranquility-base', pos: [2, -4] }] : [],
  entrance: { x: 0, z: id ? 8 : 0, heading: NORTH }, cameraDistance: 12,
});
const mod = (name: string): SceneModule => ({
  default: (p: SceneProps) => <div data-testid="scene" data-name={name} data-building={p.buildingId ?? ''} />,
  sceneGeometry: geoFor,
});
const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => ((resolve = a), (reject = b)));
  return { promise, resolve, reject };
};
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

let store: WorldStore;
const unhandled = vi.fn();
beforeEach(() => {
  store = createWorldStore(null);
  reg.load.mockReset();
  process.on('unhandledRejection', unhandled);
});
afterEach(() => {
  process.off('unhandledRejection', unhandled);
  unhandled.mockReset();
});

const mount = (onLoadFailed = vi.fn()) => {
  render(<SceneSwitcher theme={theme} reducedMotion={false} onLoadFailed={onLoadFailed} store={store} />);
  return onLoadFailed;
};

describe('SceneSwitcher', () => {
  it('pending interior → commit with spawnPoseFor and renders the module', async () => {
    reg.load.mockImplementation((s: Scene) => Promise.resolve(mod(s.kind === 'world' ? 'world' : s.id)));
    mount();
    const target = { scene: { kind: 'interior', id: 'workshop' } as Scene, pose: null, panelId: 'tranquility-base' };
    act(() => store.getState().go(target, { instant: true }));
    await flush();
    const s = store.getState();
    expect(s.scene).toEqual({ kind: 'interior', id: 'workshop' });
    expect(s.phase).toBe('fading-in');
    expect(s.pending).toBeNull();
    expect(s.spawn.pose).toEqual(spawnPoseFor(target, geoFor('workshop')));
    expect(s.activeId).toBe('tranquility-base');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-building', 'workshop');
  });

  it('renders nothing while loading', async () => {
    const d = deferred<SceneModule>();
    reg.load.mockReturnValue(d.promise);
    mount();
    act(() => store.getState().go({ scene: { kind: 'world' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    expect(screen.queryByTestId('scene')).toBeNull();
    d.resolve(mod('world'));
    await flush();
    expect(screen.getByTestId('scene')).toHaveAttribute('data-name', 'world');
  });

  it('RF2: rejection → toast, back in the world at the gym exit, onLoadFailed once, no unhandled rejection', async () => {
    reg.load.mockImplementation((s: Scene) => (s.kind === 'world' ? Promise.resolve(mod('world')) : Promise.reject(new Error('chunk'))));
    const failed = mount();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'gym' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    await flush();
    const s = store.getState();
    expect(s.toast).toBe("Couldn't open this building");
    expect(s.scene).toEqual({ kind: 'world' });
    expect(s.pending).toBeNull();
    expect(s.spawn.pose).toEqual(exitPose('gym'));
    expect(failed).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('scene')).toHaveAttribute('data-name', 'world');
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('a second go while the first load is pending → only the second commits', async () => {
    const first = deferred<SceneModule>();
    reg.load.mockImplementation((s: Scene) => (s.kind === 'interior' && s.id === 'library' ? first.promise : Promise.resolve(mod('gym'))));
    mount();
    const commit = vi.spyOn(store.getState(), 'commit');
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'library' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'gym' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    first.resolve(mod('library'));
    await flush();
    expect(store.getState().scene).toEqual({ kind: 'interior', id: 'gym' });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('scene')).toHaveAttribute('data-name', 'gym');
  });

  it('a stale rejection is ignored', async () => {
    const first = deferred<SceneModule>();
    reg.load.mockImplementation((s: Scene) => (s.kind === 'interior' && s.id === 'library' ? first.promise : Promise.resolve(mod('gym'))));
    const failed = mount();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'library' }, pose: null, panelId: null }, { instant: true }));
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'gym' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    first.reject(new Error('late'));
    await flush();
    expect(store.getState().toast).toBeNull();
    expect(failed).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe('SceneSwitcher floors', () => {
  const floorMod = (): { m: SceneModule; spy: ReturnType<typeof vi.fn>; seen: (number | undefined)[] } => {
    const seen: (number | undefined)[] = [];
    const spy = vi.fn((id: string | null, floor?: number) => ({ ...geoFor(id), ...(id === 'hq-tower' ? { floor: floor ?? 1 } : {}) }));
    const m: SceneModule = {
      default: (p: SceneProps) => {
        seen.push(p.floor);
        return <div data-testid="scene" data-floor={p.floor ?? ''} />;
      },
      sceneGeometry: spy as unknown as SceneModule['sceneGeometry'],
    };
    return { m, spy, seen };
  };

  it('an unspecified floor resolves through the geometry and is committed', async () => {
    const { m, spy } = floorMod();
    reg.load.mockResolvedValue(m);
    mount();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'hq-tower' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    expect(spy).toHaveBeenCalledWith('hq-tower', undefined);
    expect(store.getState().scene).toEqual({ kind: 'interior', id: 'hq-tower', floor: 1 });
  });
  it('floor 3 reaches sceneGeometry and the component', async () => {
    const { m, spy } = floorMod();
    reg.load.mockResolvedValue(m);
    mount();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'hq-tower', floor: 3 }, pose: null, panelId: null }, { instant: true }));
    await flush();
    expect(spy).toHaveBeenCalledWith('hq-tower', 3);
    expect(screen.getByTestId('scene')).toHaveAttribute('data-floor', '3');
    expect(store.getState().scene).toEqual({ kind: 'interior', id: 'hq-tower', floor: 3 });
  });
  it('a building without floors commits a scene with no floor key', async () => {
    const { m } = floorMod();
    reg.load.mockResolvedValue(m);
    mount();
    act(() => store.getState().go({ scene: { kind: 'interior', id: 'workshop' }, pose: null, panelId: null }, { instant: true }));
    await flush();
    expect('floor' in store.getState().scene).toBe(false);
  });
});
