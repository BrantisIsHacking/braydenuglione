import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { stations } from '../../content';
import { liveInput } from '../liveInput';
import type { Pose } from '../logic/court';
import { combineInput, joystickToInput, keysToInput } from '../logic/input';
import { NO_INPUT, step } from '../logic/movement';
import { inReach, nearest, type Placed } from '../logic/proximity';
import { useArena } from '../store';
import { materials } from './materials';

export const playerPose: Pose = { x: 0, z: 0, heading: 0 };
const placed: Placed[] = stations.map((s) => ({ id: s.id, pos: s.pos }));

// SEAM: Phase 3 swaps this for the avatar.
export function PlayerBody() {
  return (
    <>
      <mesh position={[0, 0.9, 0]} material={materials.accent}>
        <capsuleGeometry args={[0.35, 1.1, 4, 12]} />
      </mesh>
      <mesh position={[0.38, 1.3, 0]} material={materials.line}>
        <boxGeometry args={[0.3, 0.12, 0.12]} />
      </mesh>
    </>
  );
}

export function Player() {
  const ref = useRef<Group>(null);
  const pose = useRef<Pose>({ ...useArena.getState().spawn.pose });
  const seq = useRef(-1);

  useFrame((_, dt) => {
    const st = useArena.getState();
    if (st.spawn.seq !== seq.current) {
      seq.current = st.spawn.seq;
      pose.current = { ...st.spawn.pose };
    }
    const input = st.activeId ? NO_INPUT : combineInput(keysToInput(liveInput.pressed), joystickToInput(liveInput.joy));
    pose.current = step(pose.current, input, dt);
    const p = pose.current;
    playerPose.x = p.x;
    playerPose.z = p.z;
    playerPose.heading = p.heading;
    if (ref.current) {
      ref.current.position.set(p.x, 0, p.z);
      ref.current.rotation.y = -p.heading;
    }
    const n = nearest(p, placed);
    st.setProximity(n ? n.id : null, n && inReach(n.dist) ? n.id : null);
  });

  return (
    <group ref={ref}>
      <PlayerBody />
    </group>
  );
}
