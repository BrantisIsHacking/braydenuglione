import { LineBasicMaterial, MeshToonMaterial } from 'three';
import { gradientMap } from '../../../scene/materials';
import { GYM_LOOK as L } from '../gymLook';

const toon = (color: string) => new MeshToonMaterial({ color, gradientMap });

/** Matte toon materials only: nothing here is emissive, so bloom never touches the gym. */
export const gym = {
  apron: toon(L.apron),
  hardwood: toon(L.hardwood),
  key: toon(L.key),
  wall: toon(L.wall),
  truss: toon(L.truss),
  stand: toon('#ffffff'),
  scoreboard: toon(L.scoreboard),
  screen: toon(L.scoreboardScreen),
  bannerA: toon(L.bannerA),
  bannerB: toon(L.bannerB),
  table: toon(L.table),
  bench: toon(L.bench),
  rim: toon(L.rim),
  mortar: new LineBasicMaterial({ color: L.wallMortar }),
};
