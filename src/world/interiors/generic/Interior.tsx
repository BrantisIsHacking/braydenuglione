import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { getBuilding, getExhibit } from '../../../content/exhibits';
import { ExhibitMarker } from '../../kit/ExhibitMarker';
import { ExitMat } from '../../kit/ExitMat';
import { Pedestals } from '../../kit/Pedestals';
import { Room } from '../../kit/Room';
import { Sign } from '../../kit/Sign';
import { nearestIds } from '../../logic/labels';
import { hallLayout, HALL } from '../../logic/hall';
import { Lighting } from '../../scene/Lighting';
import { playerPose } from '../../scene/Player';
import { useWorld } from '../../store';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';

export { sceneGeometry };

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const geo = useMemo(() => sceneGeometry(buildingId), [buildingId]);
  const layout = useMemo(() => hallLayout(geo.exhibits.length), [geo]);
  const building = buildingId ? getBuilding(buildingId) : undefined;
  const nearId = useWorld((s) => s.nearId);
  const [labels, setLabels] = useState<string[]>([]);
  const last = useRef('');
  useFrame(() => {
    const ids = nearestIds(playerPose, geo.exhibits, 6);
    const k = ids.join('|');
    if (k !== last.current) {
      last.current = k;
      setLabels(ids);
    }
  });
  return (
    <>
      <Lighting theme={theme} preset="daylight" />
      <Room width={HALL.halfW * 2} length={layout.length} floor="stone" wall={building?.accent ?? 'stone'} />
      <Pedestals positions={layout.slots} />
      {geo.exhibits.map((e) => (
        <ExhibitMarker
          key={e.id}
          title={getExhibit(e.id)?.title ?? ''}
          pos={e.pos}
          hot={nearId === e.id}
          showLabel={labels.includes(e.id)}
          reducedMotion={reducedMotion}
        />
      ))}
      {building && <Sign text={building.sign} position={[0, 2.2, -layout.length + 0.1]} board="ink" />}
      <ExitMat rect={layout.exit.rect} />
    </>
  );
}
