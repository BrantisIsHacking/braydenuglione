import { buildings } from '../../content/buildings';
import { Sign } from '../kit/Sign';
import { theme } from '../look/theme';
import { worldSigns } from './signs';

const LIGHT = new Set<string>(theme.lightBoards);
const signs = worldSigns();

export function SignBoards() {
  return (
    <>
      {signs.map((s) => {
        const accent = buildings.find((b) => b.id === s.id)!.accent;
        return <Sign key={s.id} text={s.text} position={s.pos} board={accent} color={LIGHT.has(accent) ? theme.accents.ink : theme.accents.offWhite} size={0.45} />;
      })}
    </>
  );
}
