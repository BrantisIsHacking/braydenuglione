import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import { playerPose } from './Player';

export function ReadySignal({ target, sceneKey }: { target: RefObject<HTMLElement>; sceneKey: string }) {
  const frames = useRef(0);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const prev = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = prev;
    };
  }, [gl]);
  useEffect(() => {
    frames.current = 0;
    const el = target.current;
    if (el) {
      el.dataset.ready = 'false';
      el.dataset.drawCalls = '';
    }
  }, [sceneKey, target]);
  // Runs first each frame: info.render.calls then covers the whole previous frame (composer passes included).
  useFrame(({ gl }) => {
    const el = target.current;
    if (!el) return;
    frames.current += 1;
    const n = frames.current;
    if (n === 30) el.dataset.drawCalls = String(gl.info.render.calls);
    gl.info.reset();
    if (n === 1) {
      el.dataset.ready = 'true';
      el.dataset.scene = sceneKey;
    }
    if (n % 6 === 0) el.dataset.pose = `${playerPose.x.toFixed(2)},${playerPose.z.toFixed(2)}`;
  }, -1000);
  return null;
}
