import type { Bounds, ZoomIndex } from '../types';

export const FOV_DEG = 40, PITCH_DEG = 55, DIST_WORLD = 18, DIST_INTERIOR = 12, DEAD_ZONE_M = 1;
export const ZOOM_STEPS = [0.75, 1, 1.3] as const;

const RAD = Math.PI / 180;

/** Camera sits south of its focus point, pitched down. */
export function cameraOffset(distance: number): [number, number, number] {
  return [0, distance * Math.sin(PITCH_DEG * RAD), distance * Math.cos(PITCH_DEG * RAD)];
}

export function cameraDistance(base: number, zoom: ZoomIndex): number {
  return base * ZOOM_STEPS[zoom];
}

export function zoomStep(i: ZoomIndex, delta: -1 | 1): ZoomIndex {
  return Math.min(2, Math.max(0, i + delta)) as ZoomIndex;
}

export function viewHalfExtents(distance: number, aspect: number): { halfX: number; halfZ: number } {
  const hy = distance * Math.tan((FOV_DEG * RAD) / 2);
  return { halfX: hy * aspect, halfZ: hy / Math.sin(PITCH_DEG * RAD) };
}

function clampAxis(v: number, min: number, max: number, half: number): number {
  if (max - min <= 2 * half) return (min + max) / 2;
  return Math.min(max - half, Math.max(min + half, v));
}

export function clampFocus(
  f: { x: number; z: number }, b: Bounds, half: { halfX: number; halfZ: number },
): { x: number; z: number } {
  return { x: clampAxis(f.x, b.minX, b.maxX, half.halfX), z: clampAxis(f.z, b.minZ, b.maxZ, half.halfZ) };
}

export function smoothing(dt: number, reducedMotion: boolean): number {
  return reducedMotion ? 1 : 1 - Math.exp(-6 * dt);
}

export function followFocus(
  prev: { x: number; z: number }, player: { x: number; z: number }, dt: number, reducedMotion: boolean,
): { x: number; z: number } {
  const dx = player.x - prev.x, dz = player.z - prev.z;
  const dist = Math.hypot(dx, dz);
  if (!(dist > DEAD_ZONE_M) || !Number.isFinite(dt)) return prev;
  const desired = { x: player.x - (dx / dist) * DEAD_ZONE_M, z: player.z - (dz / dist) * DEAD_ZONE_M };
  const k = smoothing(Math.min(dt, 0.05), reducedMotion);
  return { x: prev.x + (desired.x - prev.x) * k, z: prev.z + (desired.z - prev.z) * k };
}

/** Below this width/height ratio the view is a portrait phone: the room is pulled back so more of its width fits. */
const PORTRAIT_ASPECT = 0.85;
const PORTRAIT_MAX_PULLBACK = 1.45;

/** 1 on landscape and square views; grows as the aspect narrows (Pixel 7 portrait is about 1.4), capped. */
export function portraitPullback(aspect: number): number {
  if (!(aspect > 0) || aspect >= PORTRAIT_ASPECT) return 1;
  return Math.min(PORTRAIT_MAX_PULLBACK, Math.sqrt(PORTRAIT_ASPECT / aspect));
}

/** Portrait HUD wraps to two rows, so the interior view shift is taller there. */
export function hudShiftPx(width: number, height: number, basePx: number): number {
  const portrait = width / Math.max(1, height) < PORTRAIT_ASPECT;
  return Math.min(portrait ? basePx + 40 : basePx, Math.round(height * (portrait ? 0.13 : 0.08)));
}
