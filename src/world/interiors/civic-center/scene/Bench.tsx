import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { BENCH_POS } from '../geometry';
import { bx } from '../look';

/** A park-style bench, a low offWhite table and two book slabs. */
export function Bench() {
  const [px, pz] = propAnchor(BENCH_POS);
  const bxc = px - 0.6;
  const tx = px + 0.9;
  const seat = [-0.15, 0, 0.15].map((o) => bx(bxc, 0.45, pz + o, 1.7, 0.04, 0.12));
  const back = [0.62, 0.74, 0.86].map((y) => bx(bxc, y, pz - 0.24, 1.7, 0.08, 0.04));
  return (
    <>
      <ShapeBatch shape="box" color="hardwood" outline items={[...seat, ...back]} />
      <ShapeBatch
        shape="box"
        color="ink"
        items={[
          bx(bxc - 0.75, 0.22, pz, 0.06, 0.44, 0.5), bx(bxc + 0.75, 0.22, pz, 0.06, 0.44, 0.5),
          bx(tx - 0.35, 0.19, pz + 0.1, 0.05, 0.38, 0.4), bx(tx + 0.35, 0.19, pz + 0.1, 0.05, 0.38, 0.4),
        ]}
      />
      <ShapeBatch shape="box" color="offWhite" items={[bx(tx, 0.4, pz + 0.1, 0.9, 0.04, 0.5)]} />
      <ShapeBatch shape="box" color="mustard" items={[bx(tx - 0.15, 0.45, pz + 0.1, 0.28, 0.05, 0.2)]} />
      <ShapeBatch shape="box" color="scarlet" items={[bx(tx + 0.15, 0.45, pz + 0.12, 0.26, 0.05, 0.19)]} />
    </>
  );
}
