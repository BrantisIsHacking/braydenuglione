import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Theme } from '../look/theme';

export function Effects({ theme, threshold }: { theme: Theme; threshold?: number }) {
  const b = theme.bloom;
  return (
    <EffectComposer multisampling={b.multisampling}>
      <Bloom mipmapBlur intensity={b.intensity} luminanceThreshold={threshold ?? b.threshold} luminanceSmoothing={b.smoothing} radius={b.radius} />
    </EffectComposer>
  );
}
