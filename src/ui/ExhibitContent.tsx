import type { Exhibit } from '../content/exhibits';
import { CollectionList } from './CollectionList';
import { ContactContent } from './ContactContent';
import { PlaylistEmbed } from './PlaylistEmbed';
import { StationContent } from './StationContent';
import './exhibit.css';

export { sortBooks, filterBooks } from './CollectionList';

export function ExhibitContent({ exhibit, headingLevel, focus, focusToken }: { exhibit: Exhibit; headingLevel: 2 | 3 | 4; focus?: string | null; focusToken?: number }) {
  if (exhibit.type === 'station') return <StationContent station={exhibit.station} headingLevel={headingLevel} />;
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  if (exhibit.type === 'banner') {
    const b = exhibit.banner;
    return (
      <article className="exhibit">
        <H className="exhibit__title">{b.title}</H>
        <p className="exhibit__meta">{`${b.issuer} · ${b.year}`}</p>
        <p className="exhibit__body">{b.why}</p>
      </article>
    );
  }
  if (exhibit.type === 'interest') {
    const i = exhibit.interest;
    return (
      <article className="exhibit">
        <H className="exhibit__title">{i.title}</H>
        <p className="exhibit__one">{i.oneLiner}</p>
        {i.detail && <p className="exhibit__body">{i.detail}</p>}
        {i.playlist && <PlaylistEmbed spotifyId={i.playlist.spotifyId} name={i.playlist.name} blurb={i.oneLiner} />}
        {i.link && (
          <p className="exhibit__body">
            <a href={i.link.url} target="_blank" rel="noopener noreferrer">{i.link.label}</a>
          </p>
        )}
        {i.collection && <CollectionList id={i.collection} focus={focus} focusToken={focusToken} headingLevel={(headingLevel + 1) as 3 | 4 | 5} />}
      </article>
    );
  }
  return (
    <article className="exhibit">
      <H className="exhibit__title">{exhibit.title}</H>
      <ContactContent />
    </article>
  );
}
