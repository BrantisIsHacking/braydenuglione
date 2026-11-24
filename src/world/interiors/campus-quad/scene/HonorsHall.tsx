import { useMemo } from 'react';
import { propAnchor } from '../../../logic/interior';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';

/** Colonnade facade, bookshelf and two blank diploma slabs. */
export function HonorsHall({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const columns = useMemo<InstanceItem[]>(() => [-1.2, -0.4, 0.4, 1.2].map((dx) => ({ x: ax + dx, y: 1.3, z: az + 0.3, sx: 0.3, sy: 2.6, sz: 0.3 })), [ax, az]);
  const pediment = useMemo<InstanceItem[]>(() => [{ x: ax, y: 2.8, z: az + 0.3, sx: 3, sy: 0.4, sz: 0.7 }, { x: ax, y: 0.1, z: az + 0.3, sx: 3, sy: 0.2, sz: 0.8 }], [ax, az]);
  const shelf = useMemo<InstanceItem[]>(() => [{ x: ax, y: 0.95, z: az - 1.0, sx: 1.4, sy: 1.9, sz: 0.4 }], [ax, az]);
  const books = useMemo<InstanceItem[]>(() => [0.5, 1.0, 1.5].flatMap((y) => [-0.45, 0, 0.45].map((dx) => ({ x: ax + dx, y, z: az - 0.78, sx: 0.35, sy: 0.3, sz: 0.06 }))), [ax, az]);
  const slabs = useMemo<InstanceItem[]>(() => [-1.1, 1.1].map((dx) => ({ x: ax + dx, y: 1.5, z: az - 1.15, sx: 0.55, sy: 0.75, sz: 0.06 })), [ax, az]);
  const frames = useMemo<InstanceItem[]>(() => [-1.1, 1.1].map((dx) => ({ x: ax + dx, y: 1.5, z: az - 1.2, sx: 0.7, sy: 0.9, sz: 0.05 })), [ax, az]);
  return (
    <>
      <ShapeBatch shape="cylinder" color="offWhite" items={columns} outline />
      <ShapeBatch shape="box" color="scarlet" items={pediment} />
      <ShapeBatch shape="box" color="slate" items={shelf} />
      <ShapeBatch shape="box" color="mustard" items={books} />
      <ShapeBatch shape="box" color="offWhite" items={slabs} />
      <ShapeBatch shape="box" color="ink" items={frames} />
    </>
  );
}
