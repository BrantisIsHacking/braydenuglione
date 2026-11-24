import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { toFontSafe } from '../../../logic/fontSafe';
import { theme } from '../../../look/theme';
import { POSTER, posterLines, posterSlots } from '../look';

/** Film title and year at the foot of each poster (content text, one troika Text per poster). */
export function PosterTitles() {
  const slots = posterSlots();
  const lines = posterLines();
  return (
    <>
      {slots.map((p, i) => (
        <Text
          key={p.film.title}
          font={labelFont}
          fontSize={0.21}
          lineHeight={1}
          outlineWidth={0.015}
          outlineColor={theme.palette.ink}
          maxWidth={POSTER.w - 0.08}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={theme.accents.offWhite}
          position={[p.side * POSTER.cx, POSTER.y - 0.52, p.zc + 0.08]}
        >
          {toFontSafe(lines[i])}
        </Text>
      ))}
    </>
  );
}
