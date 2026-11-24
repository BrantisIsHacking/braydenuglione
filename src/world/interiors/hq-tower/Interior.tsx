import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import type { InteriorProps } from '../../types';
import { FLOOR_SPECS, resolveFloor, sceneGeometry } from './geometry';
import { floorSigns, HQ_LOOK, HQ_WALL_HEIGHT } from './look';
import { Elevator } from './scene/Elevator';
import { DoorOut, StairsDown } from './scene/Exits';
import { FloorAiLab } from './scene/FloorAiLab';
import { FloorDojo } from './scene/FloorDojo';
import { FloorIT } from './scene/FloorIT';
import { FloorMedLab } from './scene/FloorMedLab';

export { sceneGeometry };

const FLOOR_PROPS = { 1: FloorIT, 2: FloorDojo, 3: FloorMedLab, 4: FloorAiLab } as const;

export default function Interior({ buildingId, theme, reducedMotion, floor }: InteriorProps) {
  const n = resolveFloor(floor);
  const geo = useMemo(() => sceneGeometry(buildingId, n), [buildingId, n]);
  const signs = useMemo(() => floorSigns(n), [n]);
  const Props = FLOOR_PROPS[n];
  return (
    <InteriorShell
      buildingId="hq-tower"
      spec={FLOOR_SPECS[n]}
      exhibits={geo.exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={HQ_LOOK[n].floor}
      wall={HQ_LOOK[n].wall}
      wallHeight={HQ_WALL_HEIGHT}
      exitY={n === 1 ? undefined : 0.1}
      signs={signs}
    >
      <Elevator />
      {n === 1 ? <DoorOut /> : <StairsDown />}
      <Props />
    </InteriorShell>
  );
}
