import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Env } from '../../routing/capability';
import { cameraTarget, smoothing } from '../logic/camera';
import { useArena } from '../store';
import { playerPose } from './Player';

export function CameraRig({ env }: { env: Env }) {
  const seq = useRef(-1);
  useFrame(({ camera }, dt) => {
    const t = cameraTarget(playerPose);
    const s = useArena.getState().spawn.seq;
    const k = s !== seq.current ? 1 : smoothing(Math.min(dt, 0.05), env.reducedMotion);
    seq.current = s;
    camera.position.x += (t.position[0] - camera.position.x) * k;
    camera.position.y += (t.position[1] - camera.position.y) * k;
    camera.position.z += (t.position[2] - camera.position.z) * k;
    camera.lookAt(t.lookAt[0], t.lookAt[1], t.lookAt[2]);
  });
  return null;
}
