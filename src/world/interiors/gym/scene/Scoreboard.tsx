import { useMemo, useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { profile, stations } from '../../../../content';
import { toFontSafe } from '../../../logic/fontSafe';
import { JUMBOTRON } from '../logic/dressing';
import { jumbotronHeader, jumbotronIndex, scoreboardLines } from '../logic/scoreboard';
import { GYM_LOOK } from '../gymLook';
import { gym } from './gymMaterials';

/** Red wall scoreboard: same rotation logic as the old jumbotron, no emissive trim. */
export function Scoreboard({ rotate }: { rotate: boolean }) {
  const lines = useMemo(() => scoreboardLines(stations).map(toFontSafe), []);
  const header = useMemo(() => jumbotronHeader(profile), []);
  const [idx, setIdx] = useState(0);
  useFrame(({ clock }) => {
    if (!rotate || lines.length === 0) return;
    const n = jumbotronIndex(clock.elapsedTime, lines.length);
    if (n !== idx) setIdx(n);
  });
  const { w, h, d } = JUMBOTRON;
  const fx = -d / 2 - 0.02;
  const rot: [number, number, number] = [0, -Math.PI / 2, 0];
  return (
    <group position={[JUMBOTRON.x, JUMBOTRON.y, JUMBOTRON.z]}>
      <mesh material={gym.scoreboard}>
        <boxGeometry args={[d, h, w]} />
      </mesh>
      <mesh position={[-d / 2 - 0.005, 0, 0]} rotation={rot} material={gym.screen}>
        <planeGeometry args={[w - 0.4, h - 0.4]} />
      </mesh>
      <Text font={labelFont} position={[fx, h / 6 + 0.35, 0]} rotation={rot} fontSize={0.5} color={GYM_LOOK.text} anchorX="center" anchorY="middle">
        {header}
      </Text>
      <Text font={labelFont} position={[fx, -0.4, 0]} rotation={rot} fontSize={0.3} maxWidth={6.4} textAlign="center" color={GYM_LOOK.text} anchorX="center" anchorY="middle">
        {lines[idx] ?? ''}
      </Text>
    </group>
  );
}
