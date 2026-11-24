import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BoxScore } from './boxscore/BoxScore';
import { readEnv, type Env } from './routing/capability';
import { hashForRoute, needsStartScreen, parseRoute, resolveScreen, type Route } from './routing/routes';
import { WorldBoundary } from './shell/WorldBoundary';
import { StartScreen } from './shell/StartScreen';
import { loadWorld } from './shell/loadWorld';
import { readStarted, writeStarted } from './shell/started';

export { STARTED_KEY } from './shell/started';

const World = lazy(() => loadWorld());
const FAILURE = "Brayden's World couldn't start on this device — here's the box score.";

/** Parse the current hash; the legacy #/arena alias and non-canonical building hashes (bad or redundant floors) are rewritten in place (no new history entry). */
function readRoute(): Route {
  const r = parseRoute(window.location.hash);
  if (r.view === 'building') {
    const canonical = r.legacy ? '#/b/gym' : hashForRoute(r);
    if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }
  return r;
}

export default function App({ env: envProp }: { env?: Env } = {}) {
  const [env] = useState<Env>(() => envProp ?? readEnv());
  const [route, setRoute] = useState<Route>(readRoute);
  const [started, setStarted] = useState(readStarted);

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);

  const markStarted = useCallback(() => {
    writeStarted();
    setStarted(true);
  }, []);

  const screen = resolveScreen(route, env);
  const start = screen === 'world' && needsStartScreen(route, started);
  const inWorld = screen === 'world' && !start;

  useEffect(() => {
    if (inWorld && !started) markStarted();
  }, [inWorld, started, markStarted]);

  if (screen === 'boxscore') {
    return (
      <BoxScore
        onExplore={
          env.webgl
            ? () => {
                markStarted();
                window.location.hash = '#/world';
              }
            : undefined
        }
      />
    );
  }
  if (start) return <StartScreen onExplore={markStarted} touch={env.coarsePointer} />;
  return (
    <WorldBoundary fallback={<BoxScore notice={FAILURE} />}>
      <Suspense fallback={<p role="status">Loading Brayden&apos;s World…</p>}>
        <World env={env} />
      </Suspense>
    </WorldBoundary>
  );
}
