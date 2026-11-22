import { CENTER_CIRCLE_R, COURT_HALF_X, COURT_HALF_Z, HOOP_X, KEY_LENGTH, KEY_WIDTH, THREE_PT_R } from '../logic/court';
import { materials } from './materials';

const W = 0.05;
const Y = 0.02;

function Strip({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh position={[x, Y, z]} rotation={[-Math.PI / 2, 0, 0]} material={materials.line}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

function Arc({ cx, r, start, len }: { cx: number; r: number; start: number; len: number }) {
  return (
    <mesh position={[cx, Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.line}>
      <ringGeometry args={[r - W / 2, r + W / 2, 64, 1, start, len]} />
    </mesh>
  );
}

export function Court() {
  const L = COURT_HALF_X * 2, Wd = COURT_HALF_Z * 2;
  const a = Math.asin(6.4 / THREE_PT_R);
  const keyCx = COURT_HALF_X - KEY_LENGTH / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={materials.floor}>
        <planeGeometry args={[34, 24]} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.court}>
        <planeGeometry args={[L, Wd]} />
      </mesh>
      {/* boundary */}
      <Strip x={0} z={COURT_HALF_Z} w={L} d={W} />
      <Strip x={0} z={-COURT_HALF_Z} w={L} d={W} />
      <Strip x={COURT_HALF_X} z={0} w={W} d={Wd} />
      <Strip x={-COURT_HALF_X} z={0} w={W} d={Wd} />
      {/* half line + centre ring */}
      <Strip x={0} z={0} w={W} d={Wd} />
      <Arc cx={0} r={CENTER_CIRCLE_R} start={0} len={Math.PI * 2} />
      {/* three-point arcs */}
      <Arc cx={HOOP_X} r={THREE_PT_R} start={Math.PI - a} len={2 * a} />
      <Arc cx={-HOOP_X} r={THREE_PT_R} start={-a} len={2 * a} />
      {/* keys */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Strip x={s * (COURT_HALF_X - KEY_LENGTH)} z={0} w={W} d={KEY_WIDTH} />
          <Strip x={s * keyCx} z={KEY_WIDTH / 2} w={KEY_LENGTH} d={W} />
          <Strip x={s * keyCx} z={-KEY_WIDTH / 2} w={KEY_LENGTH} d={W} />
        </group>
      ))}
    </group>
  );
}
