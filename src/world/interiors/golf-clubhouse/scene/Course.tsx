import { ShapeBatch } from '../../../kit/ShapeBatch';
import { LAWN_BENCH, TREES } from '../geometry';
import { bx, cy } from '../look';

/** Floor 2 scenery: gate path, west-lawn trees and bench. */
export function Course() {
  return (
    <>
      <ShapeBatch shape="box" color="path" items={[bx(0, 0.012, -3.7, 2.2, 0.024, 4.6)]} />
      <ShapeBatch shape="cylinder" color="hardwood" items={TREES.map(([x, z]) => cy(x, 0.5, z, 0.35, 1.0))} />
      <ShapeBatch shape="cone" color="fairway" items={TREES.flatMap(([x, z]) => [cy(x, 1.8, z, 2.0, 2.0), cy(x, 2.9, z, 1.5, 1.6)])} />
      <ShapeBatch shape="box" color="hardwood" outline items={[bx(LAWN_BENCH.x, 0.45, LAWN_BENCH.z, 2.2, 0.1, 0.6)]} />
      <ShapeBatch shape="box" color="slate" items={[bx(LAWN_BENCH.x - 0.9, 0.22, LAWN_BENCH.z, 0.1, 0.44, 0.5), bx(LAWN_BENCH.x + 0.9, 0.22, LAWN_BENCH.z, 0.1, 0.44, 0.5)]} />
    </>
  );
}
