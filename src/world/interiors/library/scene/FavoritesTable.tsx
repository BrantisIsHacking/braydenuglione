import { useMemo } from 'react';
import { Caption } from '../../../kit/Caption';
import { CARD, favoriteCards, tableBatches } from '../look';
import { Batches } from './Batches';

/** The favorites display table: tiered book cards carrying the favorite titles. */
export function FavoritesTable() {
  const list = useMemo(() => tableBatches(), []);
  const cards = useMemo(() => favoriteCards(), []);
  return (
    <>
      <Batches list={list} outline />
      {cards.map((k) => (
        <Caption
          key={k.title}
          text={k.title}
          position={[k.x, k.y, k.z + CARD.t / 2 + 0.01]}
          size={0.28}
          maxWidth={CARD.w - 0.1}
          color={k.color === 'brick' ? 'offWhite' : 'ink'}
        />
      ))}
    </>
  );
}
