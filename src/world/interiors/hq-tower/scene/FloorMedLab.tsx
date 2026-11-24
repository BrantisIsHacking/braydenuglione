import { getExhibit } from '../../../../content/exhibits';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

const z = -8.6;

function threshold() {
  const ex = getExhibit('oculogica');
  return ex && ex.type === 'station' ? ex.station.media.find((m) => m.src.endsWith('threshold-3.webp')) : undefined;
}

/** Floor 3: oculogica (eye-scan station + chart board) and ai-camp (bench with two monitors). */
export function FloorMedLab() {
  const media = threshold();
  return (
    <>
      <ShapeBatch shape="box" color="stone" items={[bx(1, 0.45, z, 2.4, 0.9, 0.8), bx(5.5, 0.45, z, 2.4, 0.9, 0.8)]} />
      <ShapeBatch shape="sphere" color="offWhite" outline items={[{ x: 0.5, y: 1.25, z, sx: 0.6, sy: 0.6, sz: 0.6 }]} />
      <ShapeBatch shape="sphere" color="scarlet" items={[{ x: 0.5, y: 1.25, z: z + 0.27, sx: 0.22, sy: 0.22, sz: 0.1 }]} />
      <ShapeBatch shape="sphere" color="ink" items={[{ x: 0.5, y: 1.25, z: z + 0.31, sx: 0.1, sy: 0.1, sz: 0.06 }]} />
      <ShapeBatch
        shape="box"
        color="ink"
        items={[bx(1.6, 1.0, z + 0.1, 0.5, 0.2, 0.3), bx(1.6, 1.15, z - 0.1, 0.5, 0.1, 0.08), bx(5.0, 1.3, -9.0, 0.7, 0.5, 0.06), bx(6.0, 1.3, -9.0, 0.7, 0.5, 0.06)]}
      />
      <ShapeBatch shape="box" color="warmGlow" glow={0.8} items={[bx(5.0, 1.3, -8.96, 0.6, 0.4, 0.02), bx(6.0, 1.3, -8.96, 0.6, 0.4, 0.02)]} />
      {media && <MediaBoard media={media} width={1.4} position={[1, 1.45, -11.9]} />}
    </>
  );
}
