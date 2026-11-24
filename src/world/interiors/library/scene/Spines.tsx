import { useMemo } from 'react';
import { spineBatches } from '../look';
import { Batches } from './Batches';

/** Every book as a coloured spine (no text), one draw call per colour. */
export function Spines() {
  const list = useMemo(() => spineBatches(), []);
  return <Batches list={list} />;
}
