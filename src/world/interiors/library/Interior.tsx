import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import { StopRings } from '../../kit/StopRings';
import type { InteriorProps } from '../../types';
import { sceneGeometry, STOPS } from './geometry';
import { LIBRARY_LOOK, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { FavoritesTable } from './scene/FavoritesTable';
import { Reading } from './scene/Reading';
import { Shelves } from './scene/Shelves';
import { Spines } from './scene/Spines';
import { StringLights } from './scene/StringLights';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  // markers/rings for the content placement only; the shelf stops draw their own batched rings
  const content = useMemo(() => sceneGeometry(buildingId).exhibits.slice(0, sceneGeometry(buildingId).exhibits.length - STOPS.length), [buildingId]);
  return (
    <InteriorShell
      buildingId="library"
      spec={SPEC}
      exhibits={content}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={LIBRARY_LOOK.floor}
      wall={LIBRARY_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Reading />
      <Shelves />
      <Spines />
      <FavoritesTable />
      <StringLights />
      <StopRings stops={STOPS} reducedMotion={reducedMotion} />
    </InteriorShell>
  );
}
