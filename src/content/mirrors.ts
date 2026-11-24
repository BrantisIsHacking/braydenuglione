import type { Mirror } from './types';

// Extra placements of an exhibit outside its home building. Order matters (exhibitsIn).
export const mirrors: Mirror[] = [
  { exhibitId: 'oculogica', building: 'workshop', pos: [0, -6] },
  { exhibitId: 'critics-choice', building: 'cinema', pos: [0, -42.5] },
  { exhibitId: 'critics-choice', building: 'hall-of-fame', pos: [7.5, -6] },
  { exhibitId: 'rising-star', building: 'gym', pos: [-3, -7] },
];
