import { useMemo } from 'react';
import { Caption } from '../../../kit/Caption';
import { SHELF, shelfBatches, unitRanges } from '../look';
import { Batches } from './Batches';

/** Three tall white units with a letter-range label on each top board. */
export function Shelves() {
  const list = useMemo(shelfBatches, []);
  const ranges = useMemo(() => unitRanges(), []);
  return (
    <>
      <Batches list={list} />
      {ranges.map((r) => (
        <Caption key={r.unit} text={r.label} position={[SHELF.xs[r.unit], SHELF.height + 0.38, SHELF.z + SHELF.depth / 2 + 0.05]} size={0.34} color="brick" />
      ))}
    </>
  );
}
