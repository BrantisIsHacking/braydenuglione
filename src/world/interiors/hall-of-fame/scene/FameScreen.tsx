import { useMemo } from 'react';
import { getExhibit } from '../../../../content/exhibits';
import { MediaBoard } from '../../../kit/MediaBoard';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { FAME_LOOK } from '../look';

/** The documentary poster on an ink stand (mirror of critics-choice). */
export function FameScreen({ pos }: { pos: [number, number] }) {
  const [x, z] = propAnchor(pos);
  const ex = getExhibit(FAME_LOOK.mirrorId);
  const poster = ex?.type === 'station' ? ex.station.video?.poster : undefined;
  const stand = useMemo(() => [{ x, z, y: 0.5, sx: 0.5, sy: 1, sz: 0.4 }], [x, z]);
  if (!poster) return null;
  return (
    <>
      <ShapeBatch shape="box" items={stand} color="ink" outline />
      <MediaBoard media={poster} width={FAME_LOOK.screenWidth} position={[x, 1.9, z + 0.25]} frame="ink" />
    </>
  );
}
