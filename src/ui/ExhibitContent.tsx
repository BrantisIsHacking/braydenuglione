import type { Exhibit } from '../content/exhibits';
import { CollectionList } from './CollectionList';
import { ContactContent } from './ContactContent';
import { StationContent } from './StationContent';
import './exhibit.css';

export { sortBooks, filterBooks } from './CollectionList';

export function ExhibitContent({ exhibit, headingLevel }: { exhibit: Exhibit; headingLevel: 2 | 3 }) {
  if (exhibit.type === 'station') return <StationContent station={exhibit.station} headingLevel={headingLevel} />;
  const H = `h${headingLevel}` as 'h2' | 'h3';
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
        {i.link && (
          <p className="exhibit__body">
            <a href={i.link.url} target="_blank" rel="noopener noreferrer">{i.link.label}</a>
          </p>
        )}
        {i.collection && <CollectionList id={i.collection} />}
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
