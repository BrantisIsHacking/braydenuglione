import { Caption } from '../../../kit/Caption';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx, cy, scorecardLines, SCORECARD_COLUMNS } from '../look';

const LINES = scorecardLines();
const LINE_Y = [2.35, 1.6];

/** A framed scorecard on an easel, facing south: the two summary lines from content above a blank 9-column grid. `(x, z)` is the prop anchor. */
export function Scorecard({ x, z }: { x: number; z: number }) {
  const W = 2.8;
  const f = z + 0.05;
  const cols = Array.from({ length: SCORECARD_COLUMNS + 1 }, (_, i) => bx(x - W / 2 + 0.1 + (i * (W - 0.2)) / SCORECARD_COLUMNS, 0.65, f, 0.02, 0.4, 0.02));
  const rows = [0.85, 0.65, 0.45].map((y) => bx(x, y, f, W - 0.2, 0.02, 0.02));
  return (
    <>
      <ShapeBatch shape="box" color="offWhite" outline items={[bx(x, 1.65, z, W, 2.5, 0.08)]} />
      <ShapeBatch shape="box" color="fairway" items={[bx(x, 2.8, z + 0.05, W, 0.3, 0.03)]} />
      <ShapeBatch shape="box" color="ink" items={[...cols, ...rows]} />
      <ShapeBatch shape="cylinder" color="hardwood" items={[cy(x - 1.2, 0.3, z - 0.05, 0.08, 0.6), cy(x + 1.2, 0.3, z - 0.05, 0.08, 0.6)]} />
      {LINES.map((t, i) => (
        <Caption key={t} text={t} position={[x, LINE_Y[i] ?? 1.5, z + 0.08]} size={0.28} maxWidth={W - 0.3} />
      ))}
    </>
  );
}
