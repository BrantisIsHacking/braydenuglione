import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { BENCH_D, BENCH_W, BENCH_X, BENCH_Z } from '../geometry';

/** Pegboard strip on the north wall and workbenches (with tool boxes) along the side walls. */
export function Dressing() {
  const peg = useMemo(() => [{ x: 0, y: 1.8, z: -15.96, sx: 18, sy: 1, sz: 0.06 }], []);
  const benches = useMemo(
    () => [-1, 1].flatMap((s) => BENCH_Z.map((z) => ({ x: s * BENCH_X, y: 0.45, z, sx: BENCH_W, sy: 0.9, sz: BENCH_D }))),
    [],
  );
  const tools = useMemo(
    () => [-1, 1].flatMap((s) => BENCH_Z.map((z) => ({ x: s * BENCH_X, y: 1.0, z: z + 0.5, sx: 0.5, sy: 0.2, sz: 0.6 }))),
    [],
  );
  return (
    <>
      <ShapeBatch shape="box" color="stone" items={peg} />
      <ShapeBatch shape="box" color="hardwood" items={benches} />
      <ShapeBatch shape="box" color="scarlet" items={tools} />
    </>
  );
}
