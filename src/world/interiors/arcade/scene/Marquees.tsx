import { games } from '../../../../content/games';
import { Caption } from '../../../kit/Caption';
import { cabinetSlot, MARQUEE } from '../look';

/** Each game title on its cabinet's lit header (the header boxes live in Cabinets). */
export function Marquees() {
  return (
    <>
      {games.map((g, i) => {
        const [x, z] = cabinetSlot(i);
        return (
          <Caption
            key={g.title}
            text={g.title}
            position={[x, MARQUEE.y + 0.1, z + MARQUEE.d / 2 + 0.02]}
            size={MARQUEE.size}
            maxWidth={MARQUEE.maxWidth}
            color={MARQUEE.color}
          />
        );
      })}
    </>
  );
}
