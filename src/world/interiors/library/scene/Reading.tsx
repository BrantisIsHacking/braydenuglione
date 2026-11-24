import { useMemo } from 'react';
import { carpetBatches, readingBatches } from '../look';
import { Batches } from './Batches';

/** Gray carpet pattern and rug, plus the mustard armchair nooks, side tables, wooden chairs and floor lamps. */
export function Reading() {
  const carpet = useMemo(carpetBatches, []);
  const nooks = useMemo(readingBatches, []);
  return (
    <>
      <Batches list={carpet} />
      <Batches list={nooks} />
    </>
  );
}
