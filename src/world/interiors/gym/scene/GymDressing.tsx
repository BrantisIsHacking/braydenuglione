import type { Theme } from '../../../look/theme';
import { Banners } from './Banners';
import { Crowd } from './Crowd';
import { Scoreboard } from './Scoreboard';
import { Shell } from './Shell';
import { Stands } from './Stands';

export function GymDressing({ theme, reducedMotion = false }: { theme: Theme; reducedMotion?: boolean }) {
  return (
    <group>
      <Shell />
      <Stands theme={theme} />
      <Crowd theme={theme} />
      <Banners />
      <Scoreboard rotate={!reducedMotion} />
    </group>
  );
}
