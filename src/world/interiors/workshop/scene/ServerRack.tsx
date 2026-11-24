import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';

/** Heights of the four results bars (metres); no numbers on the board. */
const BARS = [0.35, 0.55, 0.8, 1.0] as const;

export function ServerRack({ pos }: { pos: [number, number] }) {
  const [ax, az] = propAnchor(pos);
  const rx = ax - 0.8;
  const bx = ax + 0.7;
  const ink = useMemo(
    () => [
      { x: rx, y: 1, z: az, sx: 0.9, sy: 2, sz: 0.7 },
      { x: bx, y: 0.4, z: az, sx: 0.08, sy: 0.8, sz: 0.08 },
    ],
    [rx, bx, az],
  );
  const leds = useMemo(() => [0.5, 0.8, 1.1, 1.4, 1.7].map((y) => ({ x: rx, y, z: az + 0.36, sx: 0.7, sy: 0.05, sz: 0.02 })), [rx, az]);
  const board = useMemo(() => [{ x: bx, y: 1.4, z: az, sx: 1.4, sy: 1.2, sz: 0.08 }], [bx, az]);
  const bars = useMemo(
    () => BARS.map((h, i) => ({ x: bx - 0.48 + i * 0.32, y: 0.9 + h / 2, z: az + 0.06, sx: 0.2, sy: h, sz: 0.05 })),
    [bx, az],
  );
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={ink} outline />
      <ShapeBatch shape="box" color="warmGlow" items={leds} glow={1.2} />
      <ShapeBatch shape="box" color="slate" items={board} />
      <ShapeBatch shape="box" color="scarlet" items={bars} />
    </>
  );
}
