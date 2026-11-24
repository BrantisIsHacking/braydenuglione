import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import { StopRings } from '../../kit/StopRings';
import type { InteriorProps } from '../../types';
import { sceneGeometry, STOPS } from './geometry';
import { RECORD_LOOK, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { Batches } from './scene/Batches';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  // labels only for the content stations (music crates, karaoke stage); artist stops carry no 3D text
  const stations = useMemo(() => sceneGeometry(buildingId).exhibits.filter((e) => e.focus === undefined), [buildingId]);
  return (
    <InteriorShell
      buildingId="record-store"
      spec={SPEC}
      exhibits={stations}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={RECORD_LOOK.floor}
      wall={RECORD_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Batches />
      <StopRings stops={STOPS} reducedMotion={reducedMotion} />
    </InteriorShell>
  );
}
