import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { BENCH, LOCKER_DOOR, SCORER_TABLE } from '../logic/court';
import { materials } from './materials';

export function Furniture() {
  return (
    <group>
      <mesh position={[SCORER_TABLE.x, 0.45, SCORER_TABLE.z]} material={materials.prop}>
        <boxGeometry args={[SCORER_TABLE.length, 0.9, 0.9]} />
      </mesh>
      <mesh position={[BENCH.x, 0.25, BENCH.z]} material={materials.prop}>
        <boxGeometry args={[BENCH.length, 0.5, 0.6]} />
      </mesh>
      {/* locker doorway placeholder: visual only */}
      <group position={[LOCKER_DOOR.x, 0, LOCKER_DOOR.z]}>
        <mesh position={[0, 1.2, 0]} material={materials.dark}>
          <boxGeometry args={[1.8, 2.4, 0.1]} />
        </mesh>
        <mesh position={[-1, 1.25, 0]} material={materials.prop}>
          <boxGeometry args={[0.2, 2.5, 0.25]} />
        </mesh>
        <mesh position={[1, 1.25, 0]} material={materials.prop}>
          <boxGeometry args={[0.2, 2.5, 0.25]} />
        </mesh>
        <mesh position={[0, 2.55, 0]} material={materials.prop}>
          <boxGeometry args={[2.2, 0.2, 0.25]} />
        </mesh>
        <Text font={labelFont} position={[0, 3.0, -0.2]} rotation={[0, Math.PI, 0]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
          LOCKER ROOM
        </Text>
      </group>
    </group>
  );
}
