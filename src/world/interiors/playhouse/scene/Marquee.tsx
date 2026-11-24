import { useMemo } from 'react';
import { Bulbs } from '../../../kit/Bulbs';
import { Caption } from '../../../kit/Caption';
import { MARQUEE_CAPTION, marqueeBulbs, showTitle } from '../look';

/** Title board over the proscenium, framed by warm bulbs. */
export function Marquee({ still }: { still: boolean }) {
  const bulbs = useMemo(marqueeBulbs, []);
  return (
    <>
      <Bulbs items={bulbs} color="warmGlow" still={still} />
      <Caption text={showTitle()} position={MARQUEE_CAPTION} size={0.4} maxWidth={6.6} color="ink" />
    </>
  );
}
