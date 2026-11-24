import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';

const R = 0.8;
const PLINTH_H = 0.9;
const CY = PLINTH_H + R;
/** Crater directions on the south-facing side of the globe. */
const CRATERS: readonly [number, number, number][] = [[-0.35, 0.3, 0.88], [0.4, 0.15, 0.9], [0, -0.35, 0.93], [0.15, 0.62, 0.77], [-0.55, -0.2, 0.8]];

export function MoonGlobe({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const plinth = useMemo(() => [{ x: ax, y: PLINTH_H / 2, z: az, sx: 0.9, sy: PLINTH_H, sz: 0.9 }], [ax, az]);
  const globe = useMemo(() => [{ x: ax, y: CY, z: az, sx: 2 * R, sy: 2 * R, sz: 2 * R }], [ax, az]);
  const craters = useMemo(
    () => CRATERS.map(([x, y, z]) => {
      const l = Math.hypot(x, y, z);
      return { x: ax + (R * x) / l, y: CY + (R * y) / l, z: az + (R * z) / l, sx: 0.3, sy: 0.3, sz: 0.3 };
    }),
    [ax, az],
  );
  return (
    <>
      <ShapeBatch shape="cylinder" color="ink" items={plinth} />
      <ShapeBatch shape="sphere" color="stone" items={globe} outline />
      <ShapeBatch shape="sphere" color="slate" items={craters} />
    </>
  );
}
