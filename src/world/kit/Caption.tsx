import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import type { ThemeColorKey } from '../../content/types';
import { toFontSafe } from '../logic/fontSafe';
import { theme } from '../look/theme';

/** Smallest legible caption (Stage 2 lesson: 0.21 m is illegible at the default zoom). */
export const CAPTION_MIN = 0.28;
export function captionSize(size: number): number {
  return Math.max(size, CAPTION_MIN);
}

/** One troika Text for content captions (titles, names): font-safe, label font, centred, wraps at `maxWidth`. */
export function Caption({ text, position, rotationY = 0, size, maxWidth, color = 'ink', outline = false }: {
  text: string; position: [number, number, number]; rotationY?: number; size: number; maxWidth?: number; color?: ThemeColorKey; outline?: boolean;
}) {
  return (
    <Text
      font={labelFont}
      position={position}
      rotation={[0, rotationY, 0]}
      fontSize={captionSize(size)}
      maxWidth={maxWidth}
      textAlign="center"
      lineHeight={1.05}
      color={theme.accents[color]}
      anchorX="center"
      anchorY="middle"
      {...(outline ? { outlineWidth: 0.02, outlineColor: theme.accents.ink } : {})}
    >
      {toFontSafe(text)}
    </Text>
  );
}
