import { Text } from '@react-three/drei';
import labelFont from '@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url';
import { useMemo } from 'react';
import type { Banner } from '../../../../content/types';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { theme } from '../../../look/theme';
import { FAME_LOOK, bannerLines } from '../look';

const { cloth, clothY } = FAME_LOOK;

/** Hanging cloths above each pedestal, alternating scarlet and ink; text is title and year only. */
export function Banners({ banners, positions }: { banners: readonly Banner[]; positions: readonly [number, number][] }) {
  const lines = useMemo(() => bannerLines(banners), [banners]);
  const anchors = useMemo(() => positions.map(propAnchor).map(([x, z]): [number, number] => [x, z + FAME_LOOK.clothDz]), [positions]);
  const { scarlet, ink, rods } = useMemo(() => {
    const item = ([x, z]: [number, number]) => ({ x, z, y: clothY, sx: cloth.w, sy: cloth.h, sz: cloth.d });
    return {
      scarlet: anchors.filter((_, i) => i % 2 === 0).map(item),
      ink: anchors.filter((_, i) => i % 2 === 1).map(item),
      rods: anchors.map(([x, z]) => ({ x, z, y: clothY + cloth.h / 2 + 0.05, sx: cloth.w + 0.3, sy: 0.07, sz: 0.07 })),
    };
  }, [anchors]);
  return (
    <>
      <ShapeBatch shape="box" items={scarlet} color="scarlet" />
      <ShapeBatch shape="box" items={ink} color="ink" />
      <ShapeBatch shape="box" items={rods} color="mustard" />
      {anchors.map(([x, z], i) => (
        <Text
          key={banners[i].id}
          font={labelFont}
          position={[x, clothY, z + cloth.d / 2 + 0.01]}
          fontSize={0.15}
          maxWidth={1.0}
          lineHeight={1.1}
          textAlign="center"
          color={theme.accents.offWhite}
          anchorX="center"
          anchorY="middle"
        >
          {lines[i]}
        </Text>
      ))}
    </>
  );
}
