import { useEffect, useMemo } from 'react';
import { MeshToonMaterial } from 'three';
import type { Media } from '../../../../content/types';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { theme } from '../../../look/theme';
import { gradientMap } from '../../../scene/materials';

export function Storybook({ pos, media }: { pos: [number, number]; media: Media }) {
  const [ax, az] = propAnchor(pos);
  const sz = az + 0.3;
  const stand = useMemo(() => [{ x: ax, y: 0.25, z: sz, sx: 1.4, sy: 0.5, sz: 0.9 }], [ax, sz]);
  const cover = useMemo(() => [{ x: ax, y: 0.53, z: sz, sx: 1.3, sy: 0.06, sz: 1.1 }], [ax, sz]);
  const pageMat = useMemo(() => new MeshToonMaterial({ color: theme.accents.offWhite, gradientMap }), []);
  useEffect(() => () => pageMat.dispose(), [pageMat]);
  return (
    <>
      <ShapeBatch shape="box" color="hardwood" items={stand} outline />
      <ShapeBatch shape="box" color="scarlet" items={cover} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[ax + s * 0.6, 0.62, sz]} rotation={[0, 0, s * 0.25]} material={pageMat}>
          <boxGeometry args={[1.2, 0.08, 1.0]} />
        </mesh>
      ))}
      <MediaBoard media={media} width={1.4} position={[ax, 1.95, az - 0.55]} />
    </>
  );
}
