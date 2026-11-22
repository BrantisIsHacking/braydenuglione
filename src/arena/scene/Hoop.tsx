import { HOOP_X, RIM_HEIGHT } from '../logic/court';
import { materials } from './materials';

function Hoop({ side }: { side: 1 | -1 }) {
  const baseX = side * (HOOP_X + 1.8);
  return (
    <group>
      <mesh position={[baseX, RIM_HEIGHT / 2 + 0.3, 0]} material={materials.prop}>
        <cylinderGeometry args={[0.08, 0.08, RIM_HEIGHT + 0.6, 12]} />
      </mesh>
      <mesh position={[side * (HOOP_X + 0.65), RIM_HEIGHT + 0.5, 0]} material={materials.line}>
        <boxGeometry args={[0.06, 1.05, 1.8]} />
      </mesh>
      <mesh position={[side * (HOOP_X + 1.2), RIM_HEIGHT + 0.5, 0]} material={materials.prop}>
        <boxGeometry args={[1.2, 0.1, 0.1]} />
      </mesh>
      <mesh position={[side * HOOP_X, RIM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.accent}>
        <torusGeometry args={[0.23, 0.02, 8, 24]} />
      </mesh>
    </group>
  );
}

export function Hoops() {
  return (
    <>
      <Hoop side={1} />
      <Hoop side={-1} />
    </>
  );
}
