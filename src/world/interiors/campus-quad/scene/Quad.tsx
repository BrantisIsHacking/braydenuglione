import { useMemo } from 'react';
import { HEDGE, TREES } from '../geometry';
import { QUAD_LOOK } from '../look';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';

/** Walkways, hedge, wall trim and corner trees: 5 instanced batches. */
export function Quad({ width, length }: { width: number; length: number }) {
  const paths = useMemo<InstanceItem[]>(
    () => [
      { x: 0, y: 0.02, z: -length / 2, sx: 3, sy: 0.04, sz: length },
      { x: 0, y: 0.02, z: -12.5, sx: width, sy: 0.04, sz: 2.4 },
    ],
    [width, length],
  );
  const hedge = useMemo<InstanceItem[]>(() => HEDGE.map((h) => ({ x: h.x, y: 0.4, z: h.z, sx: h.w, sy: 0.8, sz: h.d })), []);
  const trim = useMemo<InstanceItem[]>(
    () => [
      { x: 0, y: 2.95, z: -length + 0.05, sx: width, sy: 0.2, sz: 0.12 },
      { x: -width / 2 + 0.05, y: 2.95, z: -length / 2, sx: 0.12, sy: 0.2, sz: length },
      { x: width / 2 - 0.05, y: 2.95, z: -length / 2, sx: 0.12, sy: 0.2, sz: length },
    ],
    [width, length],
  );
  const crowns = useMemo<InstanceItem[]>(() => TREES.map(([x, z]) => ({ x, y: 1.9, z, sx: 1.7, sy: 2.2, sz: 1.7 })), []);
  const trunks = useMemo<InstanceItem[]>(() => TREES.map(([x, z]) => ({ x, y: 0.4, z, sx: 0.3, sy: 0.8, sz: 0.3 })), []);
  return (
    <>
      <ShapeBatch shape="box" color={QUAD_LOOK.path} items={paths} />
      <ShapeBatch shape="box" color={QUAD_LOOK.hedge} items={hedge} />
      <ShapeBatch shape="box" color={QUAD_LOOK.trim} items={trim} />
      <ShapeBatch shape="cone" color={QUAD_LOOK.hedge} items={crowns} />
      <ShapeBatch shape="cylinder" color={QUAD_LOOK.trunk} items={trunks} />
    </>
  );
}
