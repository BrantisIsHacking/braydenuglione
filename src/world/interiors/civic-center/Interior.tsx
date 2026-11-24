import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import type { InteriorProps } from '../../types';
import { SPEC, sceneGeometry } from './geometry';
import { CIVIC_LOOK, SIGN_SPECS } from './look';
import { Bench } from './scene/Bench';
import { Classroom } from './scene/Classroom';
import { Dividers } from './scene/Dividers';
import { JudgingHall } from './scene/JudgingHall';
import { LectureHall } from './scene/LectureHall';
import { TourDesk } from './scene/TourDesk';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const exhibits = useMemo(() => sceneGeometry(buildingId).exhibits, [buildingId]);
  return (
    <InteriorShell
      buildingId="civic-center"
      spec={SPEC}
      exhibits={exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={CIVIC_LOOK.floor}
      wall={CIVIC_LOOK.wall}
      wallHeight={CIVIC_LOOK.wallHeight}
      signs={SIGN_SPECS}
    >
      <Dividers />
      <LectureHall />
      <JudgingHall />
      <Classroom />
      <TourDesk />
      <Bench />
    </InteriorShell>
  );
}
