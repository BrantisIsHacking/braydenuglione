import type { ReactNode } from 'react';
import type { BuildingId, ThemeColorKey } from '../../content/types';
import { INTERIOR_EXIT, type InteriorSpec } from '../logic/interior';
import { theme as baseTheme, type Theme } from '../look/theme';
import { Lighting } from '../scene/Lighting';
import type { PlacedExhibit } from '../types';
import { ExitMat } from './ExitMat';
import { InteriorMarkers } from './InteriorMarkers';
import { Room } from './Room';
import { Sign } from './Sign';

export type SignSpec = { text: string; position: [number, number, number]; rotationY?: number; board: ThemeColorKey; size?: number };

const LIGHT = new Set<string>(baseTheme.lightBoards);

/** Daylight lighting, the room shell, signs, the exit mat and the exhibit rings; props go in `children`. */
export function InteriorShell({
  spec, exhibits, theme, reducedMotion, floor, wall, wallHeight, exitY, signs = [], children,
}: {
  buildingId: BuildingId;
  spec: InteriorSpec;
  exhibits: readonly PlacedExhibit[];
  theme: Theme;
  reducedMotion: boolean;
  floor: ThemeColorKey;
  wall: ThemeColorKey;
  wallHeight?: number;
  /** Height of the exit arrow above the floor (default 0.02); raise it over stairs. */
  exitY?: number;
  signs?: readonly SignSpec[];
  children?: ReactNode;
}) {
  return (
    <>
      <Lighting theme={theme} preset="daylight" />
      <Room width={spec.width} length={spec.length} floor={floor} wall={wall} wallHeight={wallHeight} />
      {signs.map((s) => (
        <Sign
          key={`${s.text}@${s.position.join(',')}`}
          text={s.text}
          position={s.position}
          rotationY={s.rotationY}
          board={s.board}
          size={s.size}
          color={LIGHT.has(s.board) ? baseTheme.accents.ink : baseTheme.accents.offWhite}
        />
      ))}
      <ExitMat rect={INTERIOR_EXIT.rect} y={exitY} />
      <InteriorMarkers exhibits={exhibits} reducedMotion={reducedMotion} />
      {children}
    </>
  );
}
