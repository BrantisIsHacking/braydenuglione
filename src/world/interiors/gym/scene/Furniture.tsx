import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { toFontSafe } from '../../../logic/fontSafe';
import { BENCH, SCORER_TABLE } from '../logic/court';
import { GYM_LOOK, SCORER_BOARD, SCORER_TEXT } from '../gymLook';
import { gym } from './gymMaterials';

const B = SCORER_BOARD;
/** Board centre, gym-local: just past the table's low-x end, which is scene south (toward the camera). */
const BOARD_X = SCORER_TABLE.x - SCORER_TABLE.length / 2 - B.gap;

export function Furniture() {
  return (
    <group>
      <mesh position={[SCORER_TABLE.x, 0.45, SCORER_TABLE.z]} material={gym.table}>
        <boxGeometry args={[SCORER_TABLE.length, 0.9, 0.9]} />
      </mesh>
      {/* rotation-y -PI/2 turns the board's face to gym -x (scene +z, the camera); rotation-x tilts it back. */}
      <group position={[BOARD_X, B.y, B.z]} rotation-y={-Math.PI / 2}>
        <group rotation-x={-B.tilt}>
          <mesh material={gym.table}>
            <boxGeometry args={[B.w, B.h, B.d]} />
          </mesh>
          {SCORER_TEXT.map((t, i) => (
            <Text
              key={t}
              font={labelFont}
              position={[0, i === 0 ? B.h * 0.2 : -B.h * 0.22, B.d / 2 + 0.01]}
              fontSize={B.fontSize[i]}
              color={GYM_LOOK.text}
              anchorX="center"
              anchorY="middle"
            >
              {toFontSafe(t)}
            </Text>
          ))}
        </group>
      </group>
      <mesh position={[BENCH.x, 0.25, BENCH.z]} material={gym.bench}>
        <boxGeometry args={[BENCH.length, 0.5, 0.6]} />
      </mesh>
    </group>
  );
}
