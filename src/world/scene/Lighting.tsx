import type { Theme } from '../look/theme';

export function Lighting({ theme, preset = 'arena' }: { theme: Theme; preset?: 'arena' | 'daylight' }) {
  if (preset === 'daylight') {
    const d = theme.daylight;
    return (
      <>
        <color attach="background" args={[d.background]} />
        <ambientLight intensity={d.ambient} />
        <hemisphereLight args={[d.hemi.sky, d.hemi.ground, d.hemi.intensity]} />
        <directionalLight position={d.dir.pos} intensity={d.dir.intensity} />
      </>
    );
  }
  const l = theme.lights;
  return (
    <>
      <color attach="background" args={[theme.colors.background]} />
      {theme.fog && <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />}
      <ambientLight intensity={l.ambient} />
      <hemisphereLight args={[l.hemi.sky, l.hemi.ground, l.hemi.intensity]} />
      <directionalLight position={l.dir.pos} intensity={l.dir.intensity} />
      <spotLight
        position={l.spot.pos}
        intensity={l.spot.intensity}
        angle={l.spot.angle}
        penumbra={l.spot.penumbra}
        distance={l.spot.distance}
        decay={l.spot.decay}
        color={l.spot.color}
      />
    </>
  );
}
