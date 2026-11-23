import { materials } from '../materials';

export function CapsuleBody() {
  return (
    <>
      <mesh position={[0, 0.9, 0]} material={materials.jersey}>
        <capsuleGeometry args={[0.35, 1.1, 4, 12]} />
      </mesh>
      <mesh position={[0.38, 1.3, 0]} material={materials.line}>
        <boxGeometry args={[0.3, 0.12, 0.12]} />
      </mesh>
    </>
  );
}
