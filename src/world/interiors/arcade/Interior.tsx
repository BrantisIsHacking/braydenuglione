import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import { StopRings } from '../../kit/StopRings';
import { placedIn } from '../../logic/interior';
import { useWorld } from '../../store';
import type { InteriorProps } from '../../types';
import { sceneGeometry, STOPS } from './geometry';
import { ARCADE_LOOK, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { Cabinets } from './scene/Cabinets';
import { CeilingBulbs } from './scene/CeilingBulbs';
import { Floor } from './scene/Floor';
import { Marquees } from './scene/Marquees';
import { TokenCounter } from './scene/TokenCounter';

export { sceneGeometry };

export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const content = useMemo(() => placedIn('arcade'), []);
  const fx = useWorld((s) => s.fx);
  return (
    <InteriorShell
      buildingId="arcade"
      spec={SPEC}
      exhibits={content}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={ARCADE_LOOK.floor}
      wall={ARCADE_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Floor />
      <Cabinets />
      <Marquees />
      <TokenCounter />
      <CeilingBulbs still={reducedMotion || fx === 'low'} />
      <StopRings stops={STOPS} reducedMotion={reducedMotion} />
    </InteriorShell>
  );
}
