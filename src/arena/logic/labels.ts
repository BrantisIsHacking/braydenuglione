export const LABEL_RANGE = 7;
export const MIN_CAMERA_DEPTH = 5;

/** A station label shows when near the player and far enough ahead of the camera (along its heading). */
export function labelVisible(
  player: { x: number; z: number },
  cam: { x: number; z: number; heading: number },
  station: [number, number],
): boolean {
  const dPlayer = Math.hypot(station[0] - player.x, station[1] - player.z);
  const depth = (station[0] - cam.x) * Math.cos(cam.heading) + (station[1] - cam.z) * Math.sin(cam.heading);
  return dPlayer <= LABEL_RANGE && depth >= MIN_CAMERA_DEPTH;
}
