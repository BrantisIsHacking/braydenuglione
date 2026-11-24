import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import { propAnchor } from '../../logic/interior';
import type { InteriorProps } from '../../types';
import { COURSE_STOP_POS, FLOOR_SPECS, resolveFloor, SCORECARD_POS, sceneGeometry } from './geometry';
import { floorSigns, GOLF_LOOK } from './look';
import { Clubhouse } from './scene/Clubhouse';
import { Course } from './scene/Course';
import { CourseDoor, DoorOut, StairsDown } from './scene/CourseDoor';
import { Flags } from './scene/Flags';
import { Holes } from './scene/Holes';
import { Scorecard } from './scene/Scorecard';

export { sceneGeometry };

const CARD = propAnchor(SCORECARD_POS);
const STAND = propAnchor(COURSE_STOP_POS);

export default function Interior({ buildingId, theme, reducedMotion, floor }: InteriorProps) {
  const n = resolveFloor(floor);
  const geo = useMemo(() => sceneGeometry(buildingId, n), [buildingId, n]);
  const look = GOLF_LOOK[n];
  return (
    <InteriorShell
      buildingId="golf-clubhouse"
      spec={FLOOR_SPECS[n]}
      exhibits={geo.exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={look.floor}
      wall={look.wall}
      wallHeight={look.wallHeight}
      exitY={n === 1 ? undefined : 0.1}
      signs={floorSigns(n)}
    >
      {n === 1 ? (
        <>
          <DoorOut />
          <CourseDoor />
          <Clubhouse />
          <Scorecard x={CARD[0]} z={CARD[1]} />
        </>
      ) : (
        <>
          <StairsDown />
          <Course />
          <Holes />
          <Flags />
          <Scorecard x={STAND[0]} z={STAND[1]} />
        </>
      )}
    </InteriorShell>
  );
}
