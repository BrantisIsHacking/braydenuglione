import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, type CSSProperties } from 'react';
import { stations } from '../content';
import type { ArenaAppProps } from '../shell/loadArena';
import { resetLiveInput } from './liveInput';
import { SPAWN } from './logic/court';
import { useArena } from './store';
import { Court } from './scene/Court';
import { Furniture } from './scene/Furniture';
import { Hoops } from './scene/Hoop';
import { CameraRig } from './scene/CameraRig';
import { Player, playerPose } from './scene/Player';
import { ReadySignal } from './scene/ReadySignal';
import { StationMarker } from './scene/StationMarker';
import { Hud } from './ui/Hud';
import { Joystick } from './ui/Joystick';
import { Panel } from './ui/Panel';
import { Prompt } from './ui/Prompt';
import { useKeyboard } from './useKeyboard';

const wrapStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'var(--ink, #0a0a0a)', outline: 'none' };
const hiddenStyle: CSSProperties = {
  position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

export default function ArenaApp({ stationId, env }: ArenaAppProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useKeyboard();

  useEffect(() => {
    resetLiveInput();
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const s = useArena.getState();
    s.spawnAt(stationId);
    if (stationId) s.openPanel(stationId);
    else s.closePanel();
  }, [stationId]);

  useEffect(
    () => () => {
      const s = useArena.getState();
      s.closePanel();
      s.setProximity(null, null);
      Object.assign(playerPose, SPAWN);
    },
    [],
  );

  return (
    <div
      ref={wrapRef}
      className="arena"
      style={wrapStyle}
      data-arena-ready="false"
      data-draw-calls=""
      data-arena-focus
      tabIndex={-1}
      role="application"
      aria-label={
        env.coarsePointer
          ? '3D arena. Drag the pad to move, tap a station to open it.'
          : '3D arena. W A S D or arrows to move, E to open a station.'
      }
    >
      <h1 style={hiddenStyle}>Brayden Uglione — Arena</h1>
      <Canvas dpr={[1, 1.75]} camera={{ fov: 55, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 12, 4]} intensity={1} />
        <Court />
        <Hoops />
        <Furniture />
        {stations.map((s) => (
          <StationMarker key={s.id} id={s.id} title={s.title} pos={s.pos} reducedMotion={env.reducedMotion} />
        ))}
        <Player />
        <CameraRig env={env} />
        <ReadySignal target={wrapRef} />
      </Canvas>
      <Hud />
      <Prompt touch={env.coarsePointer} />
      {env.coarsePointer && <Joystick />}
      <Panel />
    </div>
  );
}
