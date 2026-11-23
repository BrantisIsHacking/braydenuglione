import { exhibitsIn } from '../../content/exhibits';
import { DoorFrames } from '../kit/DoorFrames';
import { ExhibitMarker } from '../kit/ExhibitMarker';
import { Lighting } from '../scene/Lighting';
import { useWorld } from '../store';
import type { SceneProps } from '../types';
import { Ground } from './Ground';
import { Massing } from './MassingMeshes';
import { Props } from './Props';
import { SignBoards } from './SignBoards';
import { Spots } from './Spots';
import { SPOT_EXHIBITS, sceneGeometry } from './geometry';

export { sceneGeometry };

const geo = sceneGeometry();
const TITLES: Record<string, string> = Object.fromEntries(
  SPOT_EXHIBITS.map(({ building, id }) => [id, exhibitsIn(building).find((p) => p.exhibit.id === id)?.exhibit.title ?? id]),
);

function Markers({ reducedMotion }: { reducedMotion: boolean }) {
  const nearId = useWorld((s) => s.nearId);
  const labelIds = useWorld((s) => s.labelIds);
  return (
    <>
      {geo.exhibits.map((e) => (
        <ExhibitMarker key={e.id} title={TITLES[e.id] ?? e.id} pos={e.pos} hot={nearId === e.id} showLabel={labelIds.includes(e.id)} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

export default function WorldScene({ theme, reducedMotion }: SceneProps) {
  return (
    <>
      <Lighting theme={theme} preset="daylight" />
      <Ground />
      <Massing />
      <DoorFrames doors={geo.doors} />
      <SignBoards />
      <Props />
      <Spots />
      <Markers reducedMotion={reducedMotion} />
    </>
  );
}
