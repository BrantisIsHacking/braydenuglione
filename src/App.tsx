import { lazy, Suspense, useEffect, useState } from 'react';
import { BoxScore } from './boxscore/BoxScore';
import { parseHash, resolveView } from './routing/hash';
import { readEnv, type Env } from './routing/capability';
import { ArenaBoundary } from './shell/ArenaBoundary';
import { TipOff } from './shell/TipOff';
import { loadArena } from './shell/loadArena';

const Arena = lazy(() => loadArena());
const FAILURE = "The arena couldn't start on this device — here's the box score.";
const enterArena = () => {
  window.location.hash = '#/arena';
};

export default function App({ env: envProp }: { env?: Env } = {}) {
  const [env] = useState<Env>(() => envProp ?? readEnv());
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const [tipped, setTipped] = useState(false);

  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const view = resolveView(route, env);
  if (view === 'boxscore') return <BoxScore onEnterArena={env.webgl ? enterArena : undefined} />;
  if (route.view === 'auto' && route.stationId === null && !tipped) return <TipOff onStart={() => setTipped(true)} touch={env.coarsePointer} />;
  return (
    <ArenaBoundary fallback={<BoxScore notice={FAILURE} />}>
      <Suspense fallback={<p role="status">Loading arena…</p>}>
        <Arena stationId={route.stationId} env={env} />
      </Suspense>
    </ArenaBoundary>
  );
}
