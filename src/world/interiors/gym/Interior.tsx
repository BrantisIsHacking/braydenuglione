import { useMemo } from 'react';
import { exhibitsIn } from '../../../content';
import { ExhibitMarker } from '../../kit/ExhibitMarker';
import { Lighting } from '../../scene/Lighting';
import { useWorld } from '../../store';
import type { InteriorProps } from '../../types';
import { sceneGeometry } from './geometry';
import { Court } from './scene/Court';
import { Furniture } from './scene/Furniture';
import { GymDressing } from './scene/GymDressing';
import { Hoops } from './scene/Hoop';

export { sceneGeometry };

/** The gym is authored in its own long-axis frame and rotated PI/2 into scene space; markers are already scene space. */
export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const placed = useMemo(() => exhibitsIn('gym').flatMap((p) => (p.pos ? [{ id: p.exhibit.id, title: p.exhibit.title, pos: p.pos }] : [])), []);
  const nearId = useWorld((s) => s.nearId);
  const labelIds = useWorld((s) => s.labelIds);
  return (
    <>
      <Lighting theme={theme} />
      <group rotation-y={Math.PI / 2}>
        <Court />
        <Hoops />
        <Furniture />
        <GymDressing theme={theme} reducedMotion={reducedMotion} />
      </group>
      {placed.map((p) => (
        <ExhibitMarker key={p.id} title={p.title} pos={p.pos} hot={nearId === p.id} showLabel={labelIds.includes(p.id)} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}
