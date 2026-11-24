import { useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import type { Group } from 'three';
import { getBuilding } from '../../content';
import type { BuildingId } from '../../content/types';
import { liveInput } from '../liveInput';
import type { Pose, SceneGeometry } from '../types';
import { combineInput, joystickToInput, keysToInput } from '../logic/input';
import { createDoorLatch, triggerAt, within, PREFETCH_RADIUS } from '../logic/doors';
import { nearestIds } from '../logic/labels';
import { MAX_DT, NO_INPUT, SPEED, step, type MoveInput } from '../logic/movement';
import { inReach, nearest, REACH_INTERIOR_M, REACH_M } from '../logic/proximity';
import { smoothSpeed } from '../logic/locomotion';
import { prefetchScene } from '../interiors/registry';
import { useWorld } from '../store';
import { AvatarBody } from './avatar/AvatarBody';
import { AvatarBoundary } from './avatar/AvatarBoundary';
import { CapsuleBody } from './avatar/CapsuleBody';
import { playerMotion } from './playerMotion';

export const playerPose: Pose = { x: 0, z: 0, heading: 0 };
export { playerMotion };

const PREFETCH_EVERY = 15;
const LABEL_COUNT = 6;

export type PlayerFrame = {
  pose: Pose;
  door: string | null;
  exit: boolean;
  pad: string | null;
  nearestId: string | null;
  nearId: string | null;
  /** Collection key of the in-reach placement, else null. */
  nearFocus: string | null;
  labels: string[];
  prefetch: string[];
};

/** One simulation frame, pure: movement, trigger containment, proximity, labels, prefetch candidates. */
export function playerFrame(prev: Pose, input: MoveInput, dt: number, geo: SceneGeometry): PlayerFrame {
  const pose = step(prev, input, dt, geo);
  const near = nearest(pose, geo.exhibits);
  const inRange = !!near && inReach(near.dist, geo.exits.length > 0 ? REACH_INTERIOR_M : REACH_M);
  return {
    pose,
    door: triggerAt(pose, geo.doors),
    exit: triggerAt(pose, geo.exits) !== null,
    pad: triggerAt(pose, geo.pads ?? []),
    nearestId: near ? near.id : null,
    nearId: near && inRange ? near.id : null,
    nearFocus: near && inRange ? (near.focus ?? null) : null,
    labels: nearestIds(pose, geo.exhibits, LABEL_COUNT),
    prefetch: within(pose, geo.doors, PREFETCH_RADIUS).filter((id) => getBuilding(id)?.kind === 'interior'),
  };
}

export function PlayerBody({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <AvatarBoundary fallback={<CapsuleBody />}>
      <Suspense fallback={<CapsuleBody />}>
        <AvatarBody reducedMotion={reducedMotion} />
      </Suspense>
    </AvatarBoundary>
  );
}

export function Player({
  reducedMotion = false,
  onDoor,
  onExit,
  onPad,
}: {
  reducedMotion?: boolean;
  onDoor?(id: BuildingId): void;
  onExit?(): void;
  onPad?(id: string): void;
}) {
  const ref = useRef<Group>(null);
  const pose = useRef<Pose>({ ...useWorld.getState().spawn.pose });
  const seq = useRef(-1);
  const frame = useRef(0);
  const doorLatch = useRef(createDoorLatch());
  const exitLatch = useRef(createDoorLatch());
  const padLatch = useRef(createDoorLatch());
  const cb = useRef({ onDoor, onExit, onPad });
  cb.current = { onDoor, onExit, onPad };

  useFrame((_, dt) => {
    const st = useWorld.getState();
    if (st.spawn.seq !== seq.current) {
      seq.current = st.spawn.seq;
      pose.current = { ...st.spawn.pose };
      doorLatch.current.reset();
      exitLatch.current.reset();
      padLatch.current.reset();
      playerMotion.speed = 0;
    }
    const geo = st.geometry;
    const prev = pose.current;
    let p = prev;
    if (geo) {
      const frozen = st.activeId !== null || st.mapOpen || st.elevatorOpen || st.phase !== 'idle';
      const input = frozen ? NO_INPUT : combineInput(keysToInput(liveInput.pressed), joystickToInput(liveInput.joy));
      const f = playerFrame(prev, input, dt, geo);
      p = pose.current = f.pose;
      st.setProximity(f.nearestId, f.nearId, f.nearFocus);
      st.setLabels(f.labels);
      st.setPad(f.pad);
      const door = doorLatch.current.update(f.door);
      const exit = exitLatch.current.update(f.exit ? 'exit' : null);
      const pad = padLatch.current.update(f.pad);
      if (pad) cb.current.onPad?.(pad);
      if (door) cb.current.onDoor?.(door as BuildingId);
      else if (exit) cb.current.onExit?.();
      frame.current += 1;
      if (frame.current % PREFETCH_EVERY === 0) {
        for (const id of f.prefetch) prefetchScene({ kind: 'interior', id: id as BuildingId });
      }
    }
    if (dt > 0) {
      const raw = Math.min(SPEED, Math.hypot(p.x - prev.x, p.z - prev.z) / Math.min(dt, MAX_DT));
      playerMotion.speed = Math.min(SPEED, smoothSpeed(playerMotion.speed, raw, dt));
    }
    playerPose.x = p.x;
    playerPose.z = p.z;
    playerPose.heading = p.heading;
    if (ref.current) {
      ref.current.position.set(p.x, 0, p.z);
      ref.current.rotation.y = -p.heading;
    }
  });

  return (
    <group ref={ref}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={1}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <PlayerBody reducedMotion={reducedMotion} />
    </group>
  );
}
