import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';

export function ReadySignal({ target }: { target: RefObject<HTMLElement> }) {
  const frames = useRef(0);
  useFrame(({ gl }) => {
    const el = target.current;
    if (!el) return;
    frames.current += 1;
    if (frames.current === 1) el.dataset.arenaReady = 'true';
    if (frames.current === 30) el.dataset.drawCalls = String(gl.info.render.calls);
  });
  return null;
}
