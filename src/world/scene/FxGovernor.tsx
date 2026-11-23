import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { createFpsMonitor, type FpsMonitor } from '../logic/fx';
import { useWorld } from '../store';

export function FxGovernor({ enabled }: { enabled: boolean }): null {
  const mon = useRef<FpsMonitor>();
  useFrame((_, dt) => {
    if (!enabled) return;
    mon.current ??= createFpsMonitor();
    if (mon.current.sample(dt) === 'low') useWorld.getState().setFx('low');
  });
  return null;
}
