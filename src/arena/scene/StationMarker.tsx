import { Billboard, Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
type TroikaText = Mesh & { fillOpacity: number; outlineOpacity: number };
import { useArena } from '../store';
import { materials } from './materials';
import { labelVisible } from '../logic/labels';
import { playerPose } from './Player';

export function StationMarker({ id, title, pos, reducedMotion = false }: { id: string; title: string; pos: [number, number]; reducedMotion?: boolean }) {
  const near = useArena((s) => s.nearId === id);
  const label = useRef<TroikaText>(null);
  const opacity = useRef(0);

  useFrame(({ camera }, dt) => {
    const t = label.current;
    if (!t) return;
    const inRange = labelVisible(playerPose, { x: camera.position.x, z: camera.position.z, heading: playerPose.heading }, pos) ? 1 : 0;
    opacity.current = reducedMotion ? inRange : opacity.current + (inRange - opacity.current) * (1 - Math.exp(-10 * Math.min(dt, 0.05)));
    if (Math.abs(opacity.current - inRange) < 0.01) opacity.current = inRange;
    t.visible = opacity.current > 0;
    t.fillOpacity = opacity.current;
    t.outlineOpacity = opacity.current;
  });

  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={near ? 1.1 : 1} material={near ? materials.accentHot : materials.accent}>
        <ringGeometry args={[0.75, 0.9, 32]} />
      </mesh>
      <Billboard position={[0, 2.0, 0]}>
        <Text
          ref={label}
          visible={false}
          font={labelFont}
          fontSize={0.32}
          maxWidth={3.2}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color={near ? '#ffffff' : '#e6e6e6'}
          outlineWidth={near ? 0.04 : 0.02}
          outlineColor={near ? '#cc0033' : '#0a0a0a'}
        >
          {title}
        </Text>
      </Billboard>
    </group>
  );
}
