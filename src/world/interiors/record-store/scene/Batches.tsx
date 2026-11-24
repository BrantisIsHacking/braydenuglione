import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { buildBatches } from '../look';

export function Batches() {
  const list = useMemo(() => buildBatches(), []);
  return (
    <>
      {list.map((b) => (
        <ShapeBatch key={b.key} shape={b.shape} items={b.items} color={b.color} glow={b.glow} />
      ))}
    </>
  );
}
