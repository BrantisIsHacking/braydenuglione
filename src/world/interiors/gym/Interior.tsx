import { useMemo } from 'react';
import { InteriorMarkers } from '../../kit/InteriorMarkers';
import { Lighting } from '../../scene/Lighting';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';
import { Court } from './scene/Court';
import { Furniture } from './scene/Furniture';
import { GymDressing } from './scene/GymDressing';
import { Hoops } from './scene/Hoop';

export { sceneGeometry };

/** The gym is authored in its own long-axis frame and rotated PI/2 into scene space; markers are already scene space. */
export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const placed = useMemo(() => sceneGeometry().exhibits, []);
  return (
    <>
      <Lighting theme={theme} />
      <group rotation-y={Math.PI / 2}>
        <Court />
        <Hoops />
        <Furniture />
        <GymDressing theme={theme} reducedMotion={reducedMotion} />
      </group>
      <InteriorMarkers exhibits={placed} reducedMotion={reducedMotion} />
    </>
  );
}
