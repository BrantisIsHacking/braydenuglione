import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { CHART_BARS } from '../look';

/** Block heights on a 3 x 3 grid of the city base. */
const HEIGHTS = [0.5, 0.9, 0.4, 0.8, 0.35, 0.7, 0.45, 1.0, 0.6] as const;
const BAR_SCALE = 0.5;

export function CityChart({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const cx = ax - 0.6;
  const base = useMemo(() => [{ x: cx, y: 0.05, z: az, sx: 1.6, sy: 0.1, sz: 1.2 }], [cx, az]);
  const blocks = useMemo(
    () => HEIGHTS.map((h, i) => ({ x: cx - 0.5 + (i % 3) * 0.5, y: 0.1 + h / 2, z: az - 0.4 + Math.floor(i / 3) * 0.4, sx: 0.36, sy: h, sz: 0.34 })),
    [cx, az],
  );
  const stone = useMemo(() => blocks.filter((_, i) => i % 2 === 0), [blocks]);
  const white = useMemo(() => blocks.filter((_, i) => i % 2 === 1), [blocks]);
  const [hi, lo] = [CHART_BARS[0] * BAR_SCALE, CHART_BARS[1] * BAR_SCALE];
  const high = useMemo(() => [{ x: ax + 0.55, y: hi / 2, z: az, sx: 0.4, sy: hi, sz: 0.4 }], [ax, az, hi]);
  const low = useMemo(() => [{ x: ax + 1.05, y: lo / 2, z: az, sx: 0.4, sy: lo, sz: 0.4 }], [ax, az, lo]);
  return (
    <>
      <ShapeBatch shape="box" color="slate" items={base} />
      <ShapeBatch shape="box" color="stone" items={stone} outline />
      <ShapeBatch shape="box" color="offWhite" items={white} />
      <ShapeBatch shape="box" color="scarlet" items={high} />
      <ShapeBatch shape="box" color="ink" items={low} />
    </>
  );
}
