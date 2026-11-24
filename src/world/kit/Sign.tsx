import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import type { ThemeColorKey } from '../../content/types';
import { toFontSafe } from '../logic/fontSafe';
import { theme } from '../look/theme';
import { gradientMap } from '../scene/materials';

export function Sign({ text, position, rotationY = 0, board, color = theme.accents.offWhite, size = 0.5 }: {
  text: string; position: [number, number, number]; rotationY?: number; board: ThemeColorKey; color?: string; size?: number;
}) {
  const safe = toFontSafe(text);
  const w = Math.max(1.2, safe.length * size * 0.5 + 0.6);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[w, size + 0.4, 0.1]} />
        <meshToonMaterial color={theme.accents[board]} gradientMap={gradientMap} />
      </mesh>
      <Text font={labelFont} fontSize={size} color={color} anchorX="center" anchorY="middle" position={[0, 0, 0.06]}>
        {safe}
      </Text>
    </group>
  );
}
