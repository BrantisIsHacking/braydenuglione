import { useMemo } from 'react';
import { propAnchor } from '../../../logic/interior';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';

/** A large blank certificate on an easel with a mustard ribbon disc. */
export function Certificate({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const z = az - 0.5;
  const legs = useMemo<InstanceItem[]>(() => [-0.8, 0.8].map((dx) => ({ x: ax + dx, y: 0.8, z, sx: 0.1, sy: 1.6, sz: 0.1 })), [ax, z]);
  const frame = useMemo<InstanceItem[]>(() => [{ x: ax, y: 1.7, z, sx: 2.2, sy: 1.5, sz: 0.1 }], [ax, z]);
  const sheet = useMemo<InstanceItem[]>(() => [{ x: ax, y: 1.7, z: z + 0.04, sx: 1.95, sy: 1.25, sz: 0.1 }], [ax, z]);
  const ribbon = useMemo<InstanceItem[]>(() => [{ x: ax + 0.6, y: 1.2, z: z + 0.1, sx: 0.4, sy: 0.4, sz: 0.06 }], [ax, z]);
  return (
    <>
      <ShapeBatch shape="box" color="slate" items={legs} />
      <ShapeBatch shape="box" color="ink" items={frame} outline />
      <ShapeBatch shape="box" color="offWhite" items={sheet} />
      <ShapeBatch shape="sphere" color="mustard" items={ribbon} />
    </>
  );
}
