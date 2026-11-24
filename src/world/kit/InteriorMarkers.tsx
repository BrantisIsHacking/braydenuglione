import { getExhibit } from '../../content/exhibits';
import { useWorld } from '../store';
import type { PlacedExhibit } from '../types';
import { ExhibitMarker } from './ExhibitMarker';

/** One ring per placed exhibit; the label is the exhibit title, and which rings are hot or labelled comes from the world store. */
export function InteriorMarkers({ exhibits, reducedMotion }: { exhibits: readonly PlacedExhibit[]; reducedMotion: boolean }) {
  const nearId = useWorld((s) => s.nearId);
  const labelIds = useWorld((s) => s.labelIds);
  return (
    <>
      {exhibits.map((e) => (
        <ExhibitMarker
          key={e.id}
          title={getExhibit(e.id)?.title ?? ''}
          pos={e.pos}
          hot={nearId === e.id}
          showLabel={labelIds.includes(e.id)}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}
