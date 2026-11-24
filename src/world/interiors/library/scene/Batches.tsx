import { ShapeBatch } from '../../../kit/ShapeBatch';
import type { BatchSpec } from '../look';

/** Renders prebuilt batches: one instanced draw call per shape / colour / glow. */
export function Batches({ list, outline = false }: { list: readonly BatchSpec[]; outline?: boolean }) {
  return (
    <>
      {list.map((b) => (
        <ShapeBatch key={b.key} shape={b.shape} items={b.items} color={b.color} glow={b.glow} outline={outline} />
      ))}
    </>
  );
}
