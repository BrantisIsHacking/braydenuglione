import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { Object3D, Shape, ShapeGeometry, type InstancedMesh } from 'three';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { toFontSafe } from '../../../logic/fontSafe';
import { BANNER, bannerSlots } from '../logic/dressing';
import { GYM_BANNERS, GYM_LOOK } from '../gymLook';
import { gym } from './gymMaterials';

function pennant(): ShapeGeometry {
  const hw = BANNER.w / 2;
  const s = new Shape();
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, -1.7);
  s.lineTo(0, -BANNER.h);
  s.lineTo(-hw, -1.7);
  s.closePath();
  return new ShapeGeometry(s);
}

function BannerSet({ items, mat, geo }: { items: number[]; mat: 'bannerA' | 'bannerB'; geo: ShapeGeometry }) {
  const slots = useMemo(() => bannerSlots(GYM_BANNERS.length), []);
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    items.forEach((idx, i) => {
      const s = slots[idx];
      o.position.set(s.x, s.y + BANNER.h / 2, s.z);
      o.rotation.set(0, s.rotY, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, slots]);
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, gym[mat], items.length]} />
      {items.map((idx) => {
        const s = slots[idx];
        return (
          <Text
            key={idx}
            font={labelFont}
            position={[s.x - 0.01, s.y + BANNER.h / 2 - 0.85, s.z]}
            rotation={[0, s.rotY, 0]}
            fontSize={0.24}
            maxWidth={1.9}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color={GYM_LOOK.text}
          >
            {toFontSafe(GYM_BANNERS[idx])}
          </Text>
        );
      })}
    </group>
  );
}

export function Banners() {
  const idx = GYM_BANNERS.map((_, i) => i);
  const geo = useMemo(pennant, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <BannerSet items={idx.filter((i) => i % 2 === 0)} mat="bannerA" geo={geo} />
      <BannerSet items={idx.filter((i) => i % 2 === 1)} mat="bannerB" geo={geo} />
    </group>
  );
}
