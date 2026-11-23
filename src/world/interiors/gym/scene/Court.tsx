import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { PlaneGeometry, RingGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { profile } from '../../../../content';
import { materials } from '../../../scene/materials';
import { CENTER_CIRCLE_R, COURT_HALF_X, COURT_HALF_Z, HOOP_X, KEY_LENGTH, KEY_WIDTH, THREE_PT_R } from '../logic/court';
import { END_WALL_X, SIDE_WALL_Z, SOUTH_WALL_X } from '../logic/dressing';
import { wordmark } from '../logic/scoreboard';
import { GYM_LOOK } from '../gymLook';
import { gym } from './gymMaterials';

const W = 0.06;
const Y = 0.025;

function flat(g: BufferGeometry, x: number, z: number): BufferGeometry {
  g.rotateX(-Math.PI / 2);
  g.translate(x, Y, z);
  return g;
}
const strip = (x: number, z: number, w: number, d: number) => flat(new PlaneGeometry(w, d), x, z);
const arc = (cx: number, r: number, start: number, len: number) => flat(new RingGeometry(r - W / 2, r + W / 2, 64, 1, start, len), cx, 0);

/** All painted white lines merged into one draw call. */
function lineGeometry(): BufferGeometry {
  const L = COURT_HALF_X * 2, Wd = COURT_HALF_Z * 2;
  const a = Math.asin(6.4 / THREE_PT_R);
  const keyCx = COURT_HALF_X - KEY_LENGTH / 2;
  const parts: BufferGeometry[] = [
    strip(0, COURT_HALF_Z, L, W), strip(0, -COURT_HALF_Z, L, W), strip(COURT_HALF_X, 0, W, Wd), strip(-COURT_HALF_X, 0, W, Wd),
    ...[1, -1].map((sg) => strip(0, (sg * (CENTER_CIRCLE_R + COURT_HALF_Z)) / 2, W, COURT_HALF_Z - CENTER_CIRCLE_R)),
    arc(0, CENTER_CIRCLE_R, 0, Math.PI * 2),
    arc(HOOP_X, THREE_PT_R, Math.PI - a, 2 * a),
    arc(-HOOP_X, THREE_PT_R, -a, 2 * a),
    ...[1, -1].flatMap((s) => [
      strip(s * (COURT_HALF_X - KEY_LENGTH), 0, W, KEY_WIDTH),
      strip(s * keyCx, KEY_WIDTH / 2, KEY_LENGTH, W),
      strip(s * keyCx, -KEY_WIDTH / 2, KEY_LENGTH, W),
    ]),
  ];
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

export function Court() {
  const lines = useMemo(lineGeometry, []);
  useEffect(() => () => lines.dispose(), [lines]);
  const keyCx = COURT_HALF_X - KEY_LENGTH / 2;
  return (
    <group>
      <mesh position={[(SOUTH_WALL_X + END_WALL_X) / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={gym.apron}>
        <planeGeometry args={[END_WALL_X - SOUTH_WALL_X, SIDE_WALL_Z * 2]} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={gym.hardwood}>
        <planeGeometry args={[COURT_HALF_X * 2, COURT_HALF_Z * 2]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * keyCx, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={gym.key}>
          <planeGeometry args={[KEY_LENGTH, KEY_WIDTH]} />
        </mesh>
      ))}
      <mesh geometry={lines} material={materials.line} />
      <Text font={labelFont} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} fontSize={0.65} color={GYM_LOOK.text} anchorX="center" anchorY="middle">
        {wordmark(profile)}
      </Text>
    </group>
  );
}
