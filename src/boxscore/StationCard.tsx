import type { Station } from '../content';
import { StationContent } from '../ui/StationContent';

export function StationCard({ station }: { station: Station }) {
  return (
    <div className="card" id={station.id} data-station={station.id} data-exhibit={station.id}>
      <StationContent station={station} headingLevel={3} />
    </div>
  );
}
