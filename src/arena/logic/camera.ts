import type { Pose } from './court';

export const CAM_BACK = 6, CAM_HEIGHT = 3.8, CAM_LOOK_AHEAD = 2, CAM_LOOK_HEIGHT = 1.2;

export function cameraTarget(p: Pose): { position: [number, number, number]; lookAt: [number, number, number] } {
  const c = Math.cos(p.heading), s = Math.sin(p.heading);
  return {
    position: [p.x - c * CAM_BACK, CAM_HEIGHT, p.z - s * CAM_BACK],
    lookAt: [p.x + c * CAM_LOOK_AHEAD, CAM_LOOK_HEIGHT, p.z + s * CAM_LOOK_AHEAD],
  };
}

export function smoothing(dt: number, reducedMotion: boolean): number {
  return reducedMotion ? 1 : 1 - Math.exp(-6 * dt);
}
