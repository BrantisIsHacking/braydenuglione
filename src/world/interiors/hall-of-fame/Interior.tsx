import { useMemo } from 'react';
import { banners } from '../../../content';
import { InteriorShell } from '../../kit/InteriorShell';
import { ShapeBatch } from '../../kit/ShapeBatch';
import type { InteriorProps } from '../../types';
import { BANNER_POS, SCREEN_POS, SPEC, sceneGeometry } from './geometry';
import { FAME_LOOK, SIGN_SPECS } from './look';
import { Banners } from './scene/Banners';
import { FameScreen } from './scene/FameScreen';
import { Trophies } from './scene/Trophies';

export { sceneGeometry };

const PILASTER_ZS = [-2, -6, -10, -14];

export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const exhibits = useMemo(() => sceneGeometry().exhibits, []);
  const runner = useMemo(() => [{ x: 0, z: -8.7, y: 0.015, sx: 2, sy: 0.03, sz: 14.6 }], []);
  const pilasters = useMemo(
    () =>
      [-1, 1].flatMap((s) =>
        PILASTER_ZS.map((z) => ({ x: s * (SPEC.width / 2 - 0.15), z, y: FAME_LOOK.wallHeight / 2, sx: 0.3, sy: FAME_LOOK.wallHeight, sz: 0.5 })),
      ),
    [],
  );
  return (
    <InteriorShell
      buildingId="hall-of-fame"
      spec={SPEC}
      exhibits={exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={FAME_LOOK.floor}
      wall={FAME_LOOK.wall}
      wallHeight={FAME_LOOK.wallHeight}
      signs={SIGN_SPECS}
    >
      <ShapeBatch shape="box" items={runner} color={FAME_LOOK.runnerColor} />
      <ShapeBatch shape="box" items={pilasters} color={FAME_LOOK.pilaster} />
      <Trophies positions={BANNER_POS} />
      <Banners banners={banners} positions={BANNER_POS} />
      <FameScreen pos={SCREEN_POS} />
    </InteriorShell>
  );
}
