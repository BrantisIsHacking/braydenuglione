import { createPortal, useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, LoopRepeat, Vector3, type AnimationAction, type Material, type Mesh } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { locomotion, MOVE_EPS } from '../../logic/locomotion';
import { useWorld } from '../../store';
import { materials } from '../materials';
import { Outline } from '../Outline';
import { playerMotion } from '../playerMotion';
import { AVATAR_HEIGHT_M, AVATAR_YAW_OFFSET, CLIP_IDLE, CLIP_RUN, PLAYER_GLB_URL } from './avatarConfig';
import { Gear } from './Gear';
import { toonify } from './toonify';

export function AvatarBody({ reducedMotion }: { reducedMotion: boolean }) {
  const gltf = useGLTF(PLAYER_GLB_URL, false);
  const { scene, meshes, scale, lift } = useMemo(() => {
    // Clone: useGLTF caches the parsed scene, so never mutate it (StrictMode/remount safe).
    const s = SkeletonUtils.clone(gltf.scene);
    toonify(s, materials);
    s.updateMatrixWorld(true);
    const box = new Box3().setFromObject(s);
    const size = box.getSize(new Vector3());
    const k = size.y > 0 ? AVATAR_HEIGHT_M / size.y : 1;
    const list: Mesh[] = [];
    s.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        list.push(m);
      }
    });
    return { scene: s, meshes: list, scale: k, lift: -box.min.y * k };
  }, [gltf.scene]);

  // Dispose only the toon materials toonify created (the shared ones belong to materials.ts).
  useEffect(() => {
    const shared = new Set<Material>(Object.values(materials));
    return () => {
      for (const m of meshes) if (!shared.has(m.material as Material)) (m.material as Material).dispose();
    };
  }, [meshes]);

  const { actions } = useAnimations(gltf.animations, scene);
  const idleRef = useRef<AnimationAction | null>(null);
  const runRef = useRef<AnimationAction | null>(null);

  useEffect(() => {
    useWorld.getState().setAvatar('model');
    const idle = actions[CLIP_IDLE] ?? null;
    const run = actions[CLIP_RUN] ?? null;
    idleRef.current = idle;
    runRef.current = run;
    for (const a of [idle, run]) {
      if (!a) continue;
      a.setLoop(LoopRepeat, Infinity);
      a.play();
    }
    return () => {
      idle?.stop();
      run?.stop();
      idleRef.current = runRef.current = null;
    };
  }, [actions]);

  useFrame(() => {
    const idle = idleRef.current;
    const run = runRef.current;
    const w = locomotion(playerMotion.speed);
    idle?.setEffectiveWeight(w.idle);
    if (run) {
      run.setEffectiveWeight(w.run);
      run.timeScale = w.timeScale;
    }
    if (idle) {
      const hold = reducedMotion && playerMotion.speed < MOVE_EPS;
      if (hold && !idle.paused) idle.time = 0;
      idle.paused = hold;
    }
  });

  return (
    <group position={[0, lift, 0]} scale={scale} rotation={[0, AVATAR_YAW_OFFSET, 0]}>
      <primitive object={scene} />
      {meshes.map((m) => createPortal(<Outline />, m))}
      <Gear scene={scene} />
    </group>
  );
}
