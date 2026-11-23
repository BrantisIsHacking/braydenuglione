import { Billboard, Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { toFontSafe } from '../logic/fontSafe';
import { materials } from '../scene/materials';

export function ExhibitMarker({ title, pos, hot, showLabel, reducedMotion }: {
  title: string; pos: [number, number]; hot: boolean; showLabel: boolean; reducedMotion: boolean;
}) {
  const s = hot && !reducedMotion ? 1.1 : 1;
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={s} material={hot ? materials.accentHot : materials.accent}>
        <ringGeometry args={[0.75, 0.9, 32]} />
      </mesh>
      {showLabel && (
        <Billboard position={[0, 2.0, 0]}>
          <Text
            font={labelFont}
            fontSize={0.32}
            maxWidth={3.2}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color={hot ? '#ffffff' : '#e6e6e6'}
            outlineWidth={hot ? 0.04 : 0.02}
            outlineColor={hot ? '#cc0033' : '#0a0a0a'}
          >
            {toFontSafe(title)}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
