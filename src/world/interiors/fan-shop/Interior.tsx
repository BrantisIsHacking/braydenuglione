import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import { StopRings } from '../../kit/StopRings';
import type { InteriorProps } from '../../types';
import { sceneGeometry, STOPS } from './geometry';
import { FAN_LOOK, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { Batches } from './scene/Batches';
import { Garments } from './scene/Garments';
import { Tags } from './scene/Tags';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const content = useMemo(() => sceneGeometry(buildingId).exhibits.filter((e) => e.focus === undefined), [buildingId]);
  return (
    <InteriorShell
      buildingId="fan-shop"
      spec={SPEC}
      exhibits={content}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={FAN_LOOK.floor}
      wall={FAN_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Batches />
      <Garments />
      <Tags />
      <StopRings stops={STOPS} reducedMotion={reducedMotion} />
    </InteriorShell>
  );
}
