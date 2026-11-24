import { useMemo } from 'react';
import { getExhibit } from '../../../content/exhibits';
import { InteriorShell } from '../../kit/InteriorShell';
import { MediaBoard } from '../../kit/MediaBoard';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';
import { CINEMA_LOOK, SCREEN, SIGN_SPECS, SPEC, WALL_HEIGHT } from './look';
import { Batches } from './scene/Batches';
import { PosterRings } from './scene/PosterRings';
import { PosterTitles } from './scene/PosterTitles';

export { sceneGeometry };

/** The documentary poster, shown on the screen. */
function documentaryPoster() {
  const e = getExhibit('critics-choice');
  return e?.type === 'station' ? e.station.video?.poster : undefined;
}

export default function Interior({ buildingId, theme, reducedMotion }: InteriorProps) {
  const screenOnly = useMemo(() => sceneGeometry(buildingId).exhibits.filter((e) => e.id === 'critics-choice'), [buildingId]);
  const poster = useMemo(documentaryPoster, []);
  return (
    <InteriorShell
      buildingId="cinema"
      spec={SPEC}
      exhibits={screenOnly}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={CINEMA_LOOK.floor}
      wall={CINEMA_LOOK.wall}
      wallHeight={WALL_HEIGHT}
      signs={SIGN_SPECS}
    >
      <Batches />
      <PosterRings reducedMotion={reducedMotion} />
      <PosterTitles />
      {poster && (
        <group position={[0, SCREEN.y, SCREEN.z]} rotation={[SCREEN.tilt, 0, 0]}>
          <MediaBoard media={poster} width={SCREEN.width} position={[0, 0, 0]} frame="ink" />
        </group>
      )}
    </InteriorShell>
  );
}
