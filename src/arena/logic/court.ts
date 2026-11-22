export type Pose = { x: number; z: number; heading: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export const COURT_HALF_X = 14, COURT_HALF_Z = 7.5;
export const PLAY_BOUNDS: Bounds = { minX: -15, maxX: 15, minZ: -9.5, maxZ: 9.5 };
export const HOOP_X = 12.425, RIM_HEIGHT = 3.05, THREE_PT_R = 6.75, KEY_LENGTH = 5.8, KEY_WIDTH = 4.9, CENTER_CIRCLE_R = 1.8;
export const SPAWN: Pose = { x: 0, z: 0, heading: 0 };
export const REACH_M = 2, MIN_STATION_GAP = 3, SPAWN_OFFSET_M = 1.5;
export const SCORER_TABLE = { x: 4.2, z: -9.2, length: 8.5 }, BENCH = { x: 4.0, z: 9.2, length: 6 }, LOCKER_DOOR = { x: -6, z: 10 };
