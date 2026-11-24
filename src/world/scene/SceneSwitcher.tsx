import { Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { spawnPoseFor } from '../history';
import { loadScene } from '../interiors/registry';
import type { Theme } from '../look/theme';
import { exitPose } from '../logic/layout';
import { useWorld, type WorldStore } from '../store';
import type { Scene, SceneGeometry, SceneModule, SceneProps, Target } from '../types';

export const LOAD_FAILED = "Couldn't open this building";

type Mounted = { Comp: ComponentType<SceneProps>; scene: Scene; seq: number };

const idOf = (s: Scene) => (s.kind === 'interior' ? s.id : null);
const floorOf = (s: Scene) => (s.kind === 'interior' ? s.floor : undefined);
/** A multi-floor geometry resolves the floor; other scenes keep theirs unchanged. */
const resolved = (s: Scene, g: SceneGeometry): Scene => (s.kind === 'interior' && g.floor !== undefined ? { ...s, floor: g.floor } : s);

/**
 * Loads the pending scene chunk while the screen is black, commits it, and renders it.
 * A failed load toasts, reloads the scene we were in (at the failed door when that is the world) and
 * calls onLoadFailed so the URL is restored. Stale loads (a newer `go` arrived) are ignored.
 */
export function SceneSwitcher({
  theme,
  reducedMotion,
  onLoadFailed,
  store = useWorld,
}: {
  theme: Theme;
  reducedMotion: boolean;
  onLoadFailed(): void;
  store?: WorldStore;
}): JSX.Element | null {
  const phase = store((s) => s.phase);
  const pending = store((s) => s.pending);
  const [mounted, setMounted] = useState<Mounted | null>(null);
  const [fatal, setFatal] = useState<unknown>(null);
  const token = useRef(0);
  const failed = useRef(onLoadFailed);
  failed.current = onLoadFailed;

  useEffect(() => {
    if (phase !== 'loading' || !pending) return;
    const my = ++token.current;
    const target: Target = pending;
    setMounted(null);

    const show = (m: SceneModule, scene: Scene) =>
      setMounted({ Comp: m.default, scene, seq: my });

    loadScene(target.scene).then(
      (m) => {
        if (my !== token.current) return;
        const geometry = m.sceneGeometry(idOf(target.scene), floorOf(target.scene));
        const scene = resolved(target.scene, geometry);
        store.getState().commit(scene, geometry, spawnPoseFor(target, geometry), target.panelId);
        show(m, scene);
      },
      () => {
        if (my !== token.current) return;
        store.getState().showToast(LOAD_FAILED);
        const back = store.getState().scene;
        loadScene(back).then(
          (m) => {
            if (my !== token.current) return;
            const geometry = m.sceneGeometry(idOf(back), floorOf(back));
            const pose = back.kind === 'world' && target.scene.kind === 'interior' ? exitPose(target.scene.id) : geometry.entrance;
            const scene = resolved(back, geometry);
            store.getState().commit(scene, geometry, pose, null);
            show(m, scene);
            failed.current();
          },
          (err) => {
            if (my !== token.current) return;
            setFatal(err ?? new Error('scene load failed'));
          },
        );
      },
    );
  }, [phase, pending, store]);

  if (fatal) throw fatal; // the world itself cannot load: WorldBoundary falls back to the box score
  if (!mounted) return null;
  const { Comp, scene, seq } = mounted;
  return (
    <Suspense fallback={null}>
      <Comp key={seq} buildingId={idOf(scene)} floor={floorOf(scene)} theme={theme} reducedMotion={reducedMotion} spawnAt={null} />
    </Suspense>
  );
}
