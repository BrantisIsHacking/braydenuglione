import { useMemo } from 'react';
import { getExhibit } from '../../../content';
import type { Media } from '../../../content/types';
import { InteriorShell } from '../../kit/InteriorShell';
import type { InteriorProps } from '../../types';
import { SPEC, sceneGeometry } from './geometry';
import { WORKSHOP_LOOK, WORKSHOP_SIGNS } from './look';
import { CityChart } from './scene/CityChart';
import { Dressing } from './scene/Dressing';
import { EyeExhibit } from './scene/EyeExhibit';
import { MoonGlobe } from './scene/MoonGlobe';
import { Podiums } from './scene/Podiums';
import { ServerRack } from './scene/ServerRack';
import { Storybook } from './scene/Storybook';

export { sceneGeometry };

function mediaOf(id: string, file: string): Media {
  const e = getExhibit(id);
  const m = e?.type === 'station' ? e.station.media.find((x) => x.src.endsWith(file)) : undefined;
  if (!m) throw new Error(`workshop: missing media ${id}/${file}`);
  return m;
}

export default function Interior({ theme, reducedMotion }: InteriorProps) {
  const exhibits = useMemo(() => sceneGeometry().exhibits, []);
  const at = useMemo(() => new Map(exhibits.map((e) => [e.id, e.pos])), [exhibits]);
  const book = useMemo(() => mediaOf('dreams-come-true', 'generated-book.webp'), []);
  const trace = useMemo(() => mediaOf('oculogica', 'correlation.webp'), []);
  return (
    <InteriorShell
      buildingId="workshop"
      spec={SPEC}
      exhibits={exhibits}
      theme={theme}
      reducedMotion={reducedMotion}
      floor={WORKSHOP_LOOK.floor}
      wall={WORKSHOP_LOOK.wall}
      wallHeight={WORKSHOP_LOOK.wallHeight}
      signs={WORKSHOP_SIGNS}
    >
      <Dressing />
      <MoonGlobe pos={at.get('tranquility-base')!} />
      <Storybook pos={at.get('dreams-come-true')!} media={book} />
      <Podiums pos={at.get('debate-mate')!} />
      <ServerRack pos={at.get('zayi-ai-studio')!} />
      <CityChart pos={at.get('airbnb-classifier')!} />
      <EyeExhibit pos={at.get('oculogica')!} media={trace} />
    </InteriorShell>
  );
}
