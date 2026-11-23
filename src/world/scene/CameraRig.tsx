import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import type { Env } from '../../routing/capability';
import { FOV_DEG, DIST_INTERIOR, DIST_WORLD, cameraDistance, cameraOffset, clampFocus, followFocus, viewHalfExtents } from '../logic/camera';
import { MAP } from '../logic/layout';
import { useWorld } from '../store';
import { playerPose } from './Player';

const LABEL_PAD_M = 3, SOUTH_PAD_M = 2;

export function CameraRig({ env }: { env: Env }) {
  const seq = useRef(-1);
  const focus = useRef({ x: 0, z: 0 });
  useFrame(({ camera, size }, dt) => {
    const st = useWorld.getState();
    const base = st.geometry?.cameraDistance ?? (st.scene.kind === 'world' ? DIST_WORLD : DIST_INTERIOR);
    const dist = cameraDistance(base, st.zoomIndex);
    const half = viewHalfExtents(dist, size.width / Math.max(1, size.height));
    const raw = st.geometry?.bounds ?? MAP;
    // Interiors: let the view run past the north wall (top-row labels clear the HUD band) and the south door (the player stays on screen).
    const bounds = st.scene.kind === 'interior' ? { ...raw, minZ: raw.minZ - LABEL_PAD_M, maxZ: raw.maxZ + (st.geometry?.cameraSouthPad ?? SOUTH_PAD_M) } : raw;
    const snap = st.spawn.seq !== seq.current;
    seq.current = st.spawn.seq;
    const next = snap ? { x: playerPose.x, z: playerPose.z } : followFocus(focus.current, playerPose, dt, env.reducedMotion);
    focus.current = clampFocus(next, bounds, half);
    const cam = camera as PerspectiveCamera;
    if (cam.fov !== FOV_DEG) {
      cam.fov = FOV_DEG;
      cam.updateProjectionMatrix();
    }
    const o = cameraOffset(dist);
    cam.position.set(focus.current.x + o[0], o[1], focus.current.z + o[2]);
    cam.lookAt(focus.current.x, 0, focus.current.z);
  });
  return null;
}
