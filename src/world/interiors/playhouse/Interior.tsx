import { useWorld } from '../../store';
import { InteriorShell } from '../../kit/InteriorShell';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';
import { PLAYHOUSE_LOOK, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { Marquee } from './scene/Marquee';
import { Stage } from './scene/Stage';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const fx = useWorld((s) => s.fx);
  return (
    <InteriorShell
      buildingId="playhouse"
      spec={SPEC}
      exhibits={sceneGeometry(buildingId).exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={PLAYHOUSE_LOOK.floor}
      wall={PLAYHOUSE_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Stage />
      <Marquee still={reducedMotion || fx === 'low'} />
    </InteriorShell>
  );
}
