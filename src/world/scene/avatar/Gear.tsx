import { createPortal } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { useMemo } from 'react';
import type { Object3D } from 'three';
import { profile } from '../../../content';
import { toFontSafe } from '../../logic/fontSafe';
import { materials } from '../materials';
import { Outline } from '../Outline';
import { BONE_CHEST, BONE_FOOT_L, BONE_FOOT_R, BONE_HEAD } from './avatarConfig';

function Sneaker({ bone }: { bone: Object3D }) {
  return createPortal(
    <mesh position={[0, 0.133, -0.021]} rotation={[Math.PI / 2, 0, 0]} material={materials.line}>
      <boxGeometry args={[0.12, 0.08, 0.28]} />
      <Outline />
    </mesh>,
    bone,
  );
}

export function Gear({ scene }: { scene: Object3D }) {
  const { head, chest, fl, fr } = useMemo(
    () => ({
      head: scene.getObjectByName(BONE_HEAD),
      chest: scene.getObjectByName(BONE_CHEST),
      fl: scene.getObjectByName(BONE_FOOT_L),
      fr: scene.getObjectByName(BONE_FOOT_R),
    }),
    [scene],
  );
  return (
    <>
      {fl && <Sneaker bone={fl} />}
      {fr && <Sneaker bone={fr} />}
      {head &&
        createPortal(
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.jersey}>
            <torusGeometry args={[0.11, 0.025, 6, 16]} />
          </mesh>,
          head,
        )}
      {chest &&
        createPortal(
          <Text
            font={labelFont}
            position={[0, 0, -0.14]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.24}
            color="#f4f0ea"
            anchorX="center"
            anchorY="middle"
          >
            {toFontSafe(String(profile.jersey))}
          </Text>,
          chest,
        )}
    </>
  );
}
