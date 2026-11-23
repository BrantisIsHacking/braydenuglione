/** Gym-local (x, z) to scene (x, z): equals Object3D rotation.y = PI/2, i.e. (x, z) -> (z, -x). */
export function gymToScene(p: [number, number]): [number, number] {
  return [p[1], 0 - p[0]];
}
