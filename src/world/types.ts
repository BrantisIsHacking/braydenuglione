import type { ComponentType } from 'react';
import type { BuildingId } from '../content/types';
import type { Theme } from './look/theme';

export type Pose = { x: number; z: number; heading: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Rect = { x: number; z: number; w: number; d: number };
export const NORTH = -Math.PI / 2, SOUTH = Math.PI / 2;
export const SPAWN_POSE: Pose = { x: 0, z: 0, heading: NORTH };
export type ZoomIndex = 0 | 1 | 2;
/** "Player in front of the exhibit": 1.5 m south of it, facing north. */
export function inFront(pos: [number, number]): Pose {
  return { x: pos[0], z: pos[1] + 1.5, heading: NORTH };
}
export type Scene = { kind: 'world' } | { kind: 'interior'; id: BuildingId; floor?: number };
export type Target = { scene: Scene; pose: Pose | null; panelId: string | null };
export type Trigger = { id: string; rect: Rect };
export type PlacedExhibit = { id: string; pos: [number, number] };
export type Pad = Trigger & { arrival: Pose };
export type SceneGeometry = { bounds: Bounds; colliders: Rect[]; doors: Trigger[]; exits: Trigger[]; exhibits: PlacedExhibit[]; entrance: Pose; cameraDistance: number; /** Interiors: metres the view may run past the south wall (default 2). Smaller pushes the room down the screen. */ cameraSouthPad?: number; pads?: Pad[]; /** Resolved floor of a multi-floor interior. */ floor?: number };
export type SceneProps = { buildingId: BuildingId | null; theme: Theme; reducedMotion: boolean; spawnAt: Pose | null; floor?: number };
export type SceneModule = { default: ComponentType<SceneProps>; sceneGeometry(id: BuildingId | null, floor?: number): SceneGeometry };
export type InteriorProps = SceneProps;
