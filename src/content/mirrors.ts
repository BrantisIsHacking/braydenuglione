import type { Mirror } from './types';

// Extra placements of an exhibit outside its home building. Order matters (exhibitsIn).
export const mirrors: Mirror[] = [
  { exhibitId: 'oculogica', building: 'workshop' },
  { exhibitId: 'critics-choice', building: 'cinema' },
  { exhibitId: 'critics-choice', building: 'hall-of-fame' },
  { exhibitId: 'rising-star', building: 'gym', pos: [-3, -7] },
];
