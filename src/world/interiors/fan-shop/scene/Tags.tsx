import { Caption } from '../../../kit/Caption';
import { jerseyTag, jerseyTeams, scarfTag, scarfTeams } from '../look';

/** Team names on tags beside the garments (not on them), one Caption each: 4 jersey tags, 6 scarf tags. */
export function Tags() {
  return (
    <>
      {jerseyTeams().map((t, i) => (
        <Caption key={t.name} text={t.name} position={jerseyTag(i)} size={0.28} maxWidth={0.7} color="ink" />
      ))}
      {scarfTeams().map((t, i) => (
        <Caption key={t.name} text={t.name} position={scarfTag(i)} size={0.28} maxWidth={1.15} color="ink" />
      ))}
    </>
  );
}
