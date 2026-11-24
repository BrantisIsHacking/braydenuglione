import { buildings } from '../../content/buildings';
import { Sign } from '../kit/Sign';
import { theme } from '../look/theme';
import { SIGN_STYLE } from './exteriors';
import { worldSigns } from './signs';

const LIGHT = new Set<string>(theme.lightBoards);
const signs = worldSigns();

export function SignBoards() {
  return (
    <>
      {signs.map((s) => {
        const accent = buildings.find((b) => b.id === s.id)!.accent;
        const st = SIGN_STYLE[s.id];
        const board = st?.board ?? accent;
        const color = st ? theme.accents[st.color] : LIGHT.has(accent) ? theme.accents.ink : theme.accents.offWhite;
        return <Sign key={s.id} text={s.text} position={s.pos} board={board} color={color} size={st?.size ?? 0.45} />;
      })}
    </>
  );
}
