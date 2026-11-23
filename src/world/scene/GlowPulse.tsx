import { useFrame } from '@react-three/fiber';
import type { MeshToonMaterial } from 'three';
import { neonLevel } from '../logic/fx';
import type { Theme } from '../look/theme';
import { materials, NEON_BASE } from './materials';

export function GlowPulse({ theme }: { theme: Theme }): null {
  useFrame(({ clock }) => {
    if (theme.pulse.amp === 0) return;
    const t = clock.elapsedTime;
    for (const k of ['neon', 'accent', 'accentHot'] as const) {
      (materials[k] as MeshToonMaterial).emissiveIntensity = neonLevel(t, NEON_BASE[k], theme.pulse);
    }
  });
  return null;
}
