import { useMemo } from 'react';
import { getBuilding } from '../../../content/exhibits';
import { InteriorMarkers } from '../../kit/InteriorMarkers';
import { ExitMat } from '../../kit/ExitMat';
import { Pedestals } from '../../kit/Pedestals';
import { Room } from '../../kit/Room';
import { Sign } from '../../kit/Sign';
import { hallLayout, HALL } from '../../logic/hall';
import { Lighting } from '../../scene/Lighting';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const geo = useMemo(() => sceneGeometry(buildingId), [buildingId]);
  const layout = useMemo(() => hallLayout(geo.exhibits.length), [geo]);
  const building = buildingId ? getBuilding(buildingId) : undefined;
  return (
    <>
      <Lighting theme={theme} preset="daylight" />
      <Room width={HALL.halfW * 2} length={layout.length} floor="stone" wall={building?.accent ?? 'stone'} />
      <Pedestals positions={layout.slots} />
      <InteriorMarkers exhibits={geo.exhibits} reducedMotion={reducedMotion} />
      {building && <Sign text={building.sign} position={[0, 2.2, -layout.length + 0.1]} board="ink" />}
      <ExitMat rect={layout.exit.rect} />
    </>
  );
}
