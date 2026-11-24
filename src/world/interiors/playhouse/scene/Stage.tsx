import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { buildBatches } from '../look';

/** Room dressing, stage, proscenium, curtain, seats and the easel: one instanced batch per shape and colour. */
export function Stage() {
  const list = useMemo(() => buildBatches(), []);
  return (
    <>
      {list.map((b) => (
        <ShapeBatch key={b.key} shape={b.shape} items={b.items} color={b.color} glow={b.glow} outline={b.outline} />
      ))}
    </>
  );
}
