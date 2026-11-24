import { useMemo } from 'react';
import { propAnchor } from '../../../logic/interior';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';
import { ROBOTICS_PHOTO } from '../look';

/** Generic fiducial grid (ink border plus a fixed interior); not a mark. */
const TAG = ['111111', '101101', '110011', '101001', '100111', '111111'];

/** Team photo on a lab wall panel, a robot chassis and an AprilTag-style board. */
export function RoboticsLab({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const panel = useMemo<InstanceItem[]>(() => [
    { x: ax - 0.3, y: 1.5, z: az - 0.75, sx: 2.5, sy: 2.4, sz: 0.1 },
    { x: ax + 1.1, y: 0.25, z: az - 0.2, sx: 0.4, sy: 0.5, sz: 0.1 },
  ], [ax, az]);
  const robot = useMemo<InstanceItem[]>(() => [
    { x: ax - 0.3, y: 0.3, z: az + 0.1, sx: 0.9, sy: 0.25, sz: 0.65 },
    { x: ax - 0.55, y: 0.65, z: az + 0.1, sx: 0.12, sy: 0.5, sz: 0.12 },
    { x: ax - 0.35, y: 0.9, z: az + 0.1, sx: 0.5, sy: 0.1, sz: 0.1 },
  ], [ax, az]);
  const wheels = useMemo<InstanceItem[]>(
    () => [-0.3, 0.3].flatMap((dx) => [-0.3, 0.3].map((dz) => ({ x: ax - 0.3 + dx, y: 0.17, z: az + 0.1 + dz, sx: 0.12, sy: 0.34, sz: 0.34 }))),
    [ax, az],
  );
  const board = useMemo<InstanceItem[]>(() => [{ x: ax + 1.1, y: 1.0, z: az - 0.2, sx: 0.75, sy: 0.75, sz: 0.06 }], [ax, az]);
  const cells = useMemo<InstanceItem[]>(() => {
    const out: InstanceItem[] = [];
    TAG.forEach((row, r) => [...row].forEach((c, k) => {
      if (c === '1') out.push({ x: ax + 1.1 + (k - 2.5) * 0.11, y: 1.0 + (2.5 - r) * 0.11, z: az - 0.16, sx: 0.1, sy: 0.1, sz: 0.03 });
    }));
    return out;
  }, [ax, az]);
  return (
    <>
      <ShapeBatch shape="box" color="slate" items={panel} outline />
      <MediaBoard media={ROBOTICS_PHOTO} width={2.2} position={[ax - 0.3, 1.5, az - 0.68]} />
      <ShapeBatch shape="box" color="scarlet" items={robot} />
      <ShapeBatch shape="sphere" color="ink" items={wheels} />
      <ShapeBatch shape="box" color="offWhite" items={board} />
      <ShapeBatch shape="box" color="ink" items={cells} />
    </>
  );
}
