import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';

export function Podiums({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const bodies = useMemo(() => [-0.8, 0.8].map((dx) => ({ x: ax + dx, y: 0.55, z: az, sx: 0.5, sy: 1.1, sz: 0.7 })), [ax, az]);
  const tops = useMemo(() => [-0.8, 0.8].map((dx) => ({ x: ax + dx, y: 1.12, z: az, sx: 0.56, sy: 0.08, sz: 0.76 })), [ax, az]);
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={bodies} outline />
      <ShapeBatch shape="box" color="scarlet" items={tops} />
    </>
  );
}
