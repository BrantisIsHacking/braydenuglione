import { useMemo } from 'react';
import { InteriorShell } from '../../kit/InteriorShell';
import type { InteriorProps } from '../../types';
import { SPEC, sceneGeometry } from './geometry';
import { QUAD_LOOK, SIGN_SPECS } from './look';
import { Certificate } from './scene/Certificate';
import { HonorsHall } from './scene/HonorsHall';
import { Quad } from './scene/Quad';
import { RoboticsLab } from './scene/RoboticsLab';
import { ScreeningRoom } from './scene/ScreeningRoom';
import { WingProps } from './scene/WingProps';

export { sceneGeometry };

export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const placed = useMemo(() => sceneGeometry('campus-quad').exhibits, []);
  const pos = useMemo(() => Object.fromEntries(placed.map((e) => [e.id, e.pos])) as Record<string, [number, number]>, [placed]);
  const wing = useMemo(
    () => ({ 'advisory-council': pos['advisory-council'], hackmcst: pos.hackmcst, nslc: pos.nslc, 'java-juniors': pos['java-juniors'] }),
    [pos],
  );
  return (
    <InteriorShell
      buildingId="campus-quad"
      spec={SPEC}
      exhibits={placed}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={QUAD_LOOK.floor}
      wall={QUAD_LOOK.wall}
      wallHeight={QUAD_LOOK.wallHeight}
      signs={SIGN_SPECS}
    >
      <Quad width={SPEC.width} length={SPEC.length} />
      <HonorsHall pos={pos['rutgers-honors']} />
      <ScreeningRoom pos={pos['critics-choice']} />
      <Certificate pos={pos.ccm} />
      <RoboticsLab pos={pos.robotics} />
      <WingProps positions={wing} />
    </InteriorShell>
  );
}
