import { useMemo } from 'react';
import type { Media } from '../../../../content/types';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';

const R = 0.55;
const EYE_Y = 1.3;

export function EyeExhibit({ pos, media }: { pos: [number, number]; media: Media }) {
  const [ax, az] = propAnchor(pos);
  const ex = ax - 0.75;
  const ez = az + 0.15;
  const bx = ax + 0.5;
  const plinth = useMemo(() => [{ x: ex, y: 0.375, z: ez, sx: 0.5, sy: 0.75, sz: 0.5 }], [ex, ez]);
  const post = useMemo(() => [{ x: bx, y: 0.43, z: az, sx: 0.1, sy: 0.86, sz: 0.1 }], [bx, az]);
  const eye = useMemo(() => [{ x: ex, y: EYE_Y, z: ez, sx: 2 * R, sy: 2 * R, sz: 2 * R }], [ex, ez]);
  // Flattened spheres read as discs facing south.
  const iris = useMemo(() => [{ x: ex, y: EYE_Y, z: ez + 0.5, sx: 0.62, sy: 0.62, sz: 0.2 }], [ex, ez]);
  const pupil = useMemo(() => [{ x: ex, y: EYE_Y, z: ez + 0.54, sx: 0.28, sy: 0.28, sz: 0.2 }], [ex, ez]);
  return (
    <>
      <ShapeBatch shape="cylinder" color="ink" items={plinth} />
      <ShapeBatch shape="box" color="ink" items={post} />
      <ShapeBatch shape="sphere" color="offWhite" items={eye} outline />
      <ShapeBatch shape="sphere" color="scarlet" items={iris} />
      <ShapeBatch shape="sphere" color="ink" items={pupil} />
      <MediaBoard media={media} width={1.6} position={[bx, 1.5, az - 0.2]} />
    </>
  );
}
