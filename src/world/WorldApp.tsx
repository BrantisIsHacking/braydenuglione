import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getBuilding } from '../content';
import type { BuildingId } from '../content/types';
import { parseRoute } from '../routing/routes';
import type { WorldAppProps } from '../shell/loadWorld';
import { createHistorySync } from './history';
import { resetLiveInput } from './liveInput';
import { forcedFx } from './logic/fx';
import { exitPose, spotPose } from './logic/layout';
import { padAction } from './logic/pads';
import { effectiveTheme, theme } from './look/theme';
import { useWorld } from './store';
import { CameraRig } from './scene/CameraRig';
import { Effects } from './scene/Effects';
import { FxGovernor } from './scene/FxGovernor';
import { GlowPulse } from './scene/GlowPulse';
import { Player, playerPose } from './scene/Player';
import { ReadySignal } from './scene/ReadySignal';
import { SceneSwitcher } from './scene/SceneSwitcher';
import { Fade } from './ui/Fade';
import { Hud } from './ui/Hud';
import { InteractButton } from './ui/InteractButton';
import { Joystick } from './ui/Joystick';
import { ElevatorDialog } from './ui/ElevatorDialog';
import { MapDialog } from './ui/MapDialog';
import { Panel } from './ui/Panel';
import { Prompt } from './ui/Prompt';
import { Toast } from './ui/Toast';
import { useKeyboard } from './useKeyboard';
import { useZoomInput } from './useZoomInput';

const wrapStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'var(--ink, #0a0a0a)', outline: 'none' };
const canvasStyle: CSSProperties = { position: 'absolute', inset: 0 };
const hiddenStyle: CSSProperties = {
  position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
const LABEL_DESKTOP = "Brayden's World. W A S D or arrows to move, E to open an exhibit, M for the map.";
const LABEL_TOUCH = "Brayden's World. Drag the pad to move, tap Interact to open an exhibit.";
const BOX_SCORE = '#/box-score';

/** The live outdoor pose is only meaningful when the world is the settled scene. */
function saveLiveWorldPose() {
  const s = useWorld.getState();
  if (s.scene.kind === 'world' && s.pending === null && s.phase === 'idle' && s.geometry) s.setWorldPose({ ...playerPose });
}

export default function WorldApp({ env }: WorldAppProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  /** worldPose was already set for this trip to the Box Score (door exit pose or live pose). */
  const poseSaved = useRef(false);
  useKeyboard();
  useZoomInput(canvasRef);
  const fx = useWorld((s) => s.fx);
  const avatar = useWorld((s) => s.avatar);
  const scene = useWorld((s) => s.scene);
  const phase = useWorld((s) => s.phase);
  const settled = useWorld((s) => s.pending === null && s.phase !== 'loading');
  const commitSeq = useWorld((s) => s.spawn.seq);
  const forced = useMemo(() => forcedFx(window.location.search, import.meta.env.VITE_ARENA_FX), []);
  const t = useMemo(
    () => effectiveTheme(theme, { reducedMotion: env.reducedMotion, lowPower: fx === 'low' }),
    [env.reducedMotion, fx],
  );

  const [nav] = useState(() => {
    const toBoxScore = () => {
      saveLiveWorldPose();
      poseSaved.current = true;
      window.location.hash = BOX_SCORE;
    };
    const sync = createHistorySync({ win: window, store: useWorld, parse: parseRoute, exitPose, spotPose, toBoxScore, reducedMotion: env.reducedMotion });
    const onDoor = (id: BuildingId) => {
      const kind = getBuilding(id)?.kind;
      if (kind === 'overlay') {
        useWorld.getState().setWorldPose(exitPose(id));
        poseSaved.current = true;
        window.location.hash = BOX_SCORE;
      } else if (kind === 'interior') {
        sync.travel(`#/b/${id}`);
      }
    };
    const onExit = () => sync.exit();
    const onPad = (id: string) => {
      const a = padAction(useWorld.getState().geometry?.pads ?? [], id);
      if (a?.kind === 'ride') sync.ride(a.floor, { padId: a.padId });
      else if (a?.kind === 'elevator') useWorld.getState().openElevator();
    };
    return { sync, toBoxScore, onDoor, onExit, onPad, ride: (floor: number, opts?: { stairs?: boolean; padId?: string }) => sync.ride(floor, opts), travel: (h: string) => sync.travel(h), restore: () => sync.restore() };
  });

  useEffect(() => {
    const s = useWorld.getState();
    s.setFx(forced ?? 'full');
    s.setAvatar('loading');
  }, [forced]);

  useEffect(() => {
    resetLiveInput();
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    poseSaved.current = false;
    nav.sync.start();
    return () => {
      nav.sync.dispose();
      if (!poseSaved.current) saveLiveWorldPose();
      const s = useWorld.getState();
      s.closePanel();
      s.closeMap();
      s.closeElevator();
      s.setPad(null);
      s.setProximity(null, null);
    };
  }, [nav]);

  // data-ready is "false" from go() until a frame after the next commit (ReadySignal remounts then).
  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.pending && !prev.pending && wrapRef.current) wrapRef.current.dataset.ready = 'false';
      }),
    [],
  );

  const dpr: number | [number, number] = fx === 'low' ? 1 : env.coarsePointer ? [1, 1.5] : [1, 1.75];
  const inGym = scene.kind === 'interior' && scene.id === 'gym';

  return (
    <div
      ref={wrapRef}
      className="world"
      style={wrapStyle}
      data-ready="false"
      data-scene=""
      data-draw-calls=""
      data-floor={scene.kind === 'interior' && scene.floor !== undefined ? String(scene.floor) : ''}
      data-transition={phase}
      data-fx={fx}
      data-motion={env.reducedMotion ? 'reduced' : 'full'}
      data-avatar={avatar}
      data-world-focus
      tabIndex={-1}
      role="application"
      aria-label={env.coarsePointer ? LABEL_TOUCH : LABEL_DESKTOP}
    >
      <Hud onScoutingOffice={nav.toBoxScore} />
      <h1 style={hiddenStyle}>Brayden Uglione — Brayden&apos;s World</h1>
      <div ref={canvasRef} style={canvasStyle}>
        <Canvas dpr={dpr} camera={{ fov: 40, near: 0.1, far: 200 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <FxGovernor enabled={forced === null && fx === 'full'} />
          <GlowPulse theme={t} />
          <SceneSwitcher theme={t} reducedMotion={env.reducedMotion} onLoadFailed={nav.restore} />
          <Player reducedMotion={env.reducedMotion} onDoor={nav.onDoor} onExit={nav.onExit} onPad={nav.onPad} />
          <CameraRig env={env} />
          {settled && <ReadySignal key={commitSeq} target={wrapRef} sceneKey={scene.kind === 'world' ? 'world' : scene.id} />}
          {fx === 'full' && !inGym && <Effects theme={t} threshold={t.daylight.bloomThreshold} />}
        </Canvas>
      </div>
      {env.coarsePointer ? (
        <>
          <Joystick />
          <InteractButton />
        </>
      ) : (
        <Prompt touch={false} />
      )}
      <Panel />
      <MapDialog onTravel={nav.travel} />
      <ElevatorDialog onRide={nav.ride} />
      <Toast />
      <Fade reducedMotion={env.reducedMotion} />
    </div>
  );
}
