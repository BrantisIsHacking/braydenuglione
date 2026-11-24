import { useMemo } from 'react';
import { propAnchor } from '../../../logic/interior';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';
import { SCREEN_MEDIA } from '../look';

/** The documentary poster on a stand, with two short rows of seats either side of the walkway. */
export function ScreeningRoom({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const stand = useMemo<InstanceItem[]>(() => [
    { x: ax, y: 0.2, z: az - 0.6, sx: 3, sy: 0.4, sz: 0.5 },
    { x: ax, y: 1.7, z: az - 0.62, sx: 3.35, sy: 2.0, sz: 0.12 },
  ], [ax, az]);
  const seats = useMemo<InstanceItem[]>(() => {
    const out: InstanceItem[] = [];
    for (const z of [-14.1, -13.3])
      for (const side of [-1, 1])
        for (const k of [0, 1, 2]) {
          const x = side * (2.4 + k * 0.7);
          out.push({ x, y: 0.25, z, sx: 0.5, sy: 0.5, sz: 0.5 });
          out.push({ x, y: 0.65, z: z - 0.22, sx: 0.5, sy: 0.5, sz: 0.1 });
        }
    return out;
  }, []);
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={stand} outline />
      <MediaBoard media={SCREEN_MEDIA} width={3.2} position={[ax, 1.7, az - 0.54]} />
      <ShapeBatch shape="box" color="scarlet" items={seats} />
    </>
  );
}
